using System.Text.Json;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace UrbanIssuesIdentity.Messaging;

public sealed class RabbitMqEventPublisher : IEventPublisher, IAsyncDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly RabbitMqOptions _options;
    private readonly ILogger<RabbitMqEventPublisher> _logger;
    private readonly SemaphoreSlim _connectionLock = new(1, 1);

    private IConnection? _connection;

    public RabbitMqEventPublisher(
        IOptions<RabbitMqOptions> options,
        ILogger<RabbitMqEventPublisher> logger)
    {
        _options = options.Value;
        _logger  = logger;
    }

    public async Task PublishAsync<T>(string routingKey, T payload, CancellationToken cancellationToken = default)
        where T : class
    {
        var connection = await GetOrCreateConnectionAsync(cancellationToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);

        var body = JsonSerializer.SerializeToUtf8Bytes(payload, JsonOptions);

        var properties = new BasicProperties
        {
            ContentType  = "application/json",
            DeliveryMode = DeliveryModes.Persistent,
            MessageId    = Guid.NewGuid().ToString(),
            Type         = typeof(T).Name,
            Timestamp    = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds())
        };

        await channel.BasicPublishAsync(
            exchange:        _options.Exchange,
            routingKey:      routingKey,
            mandatory:       true,
            basicProperties: properties,
            body:            body,
            cancellationToken: cancellationToken);

        _logger.LogInformation(
            "Published {EventType} to {Exchange} with routing key {RoutingKey}",
            typeof(T).Name, _options.Exchange, routingKey);
    }

    private async Task<IConnection> GetOrCreateConnectionAsync(CancellationToken cancellationToken)
    {
        if (_connection is { IsOpen: true })
            return _connection;

        await _connectionLock.WaitAsync(cancellationToken);
        try
        {
            if (_connection is { IsOpen: true })
                return _connection;

            if (_connection is not null)
                await _connection.DisposeAsync();

            var factory = new ConnectionFactory
            {
                HostName    = _options.HostName,
                Port        = _options.Port,
                UserName    = _options.UserName,
                Password    = _options.Password,
                VirtualHost = _options.VirtualHost,
                ClientProvidedName = "UrbanIssuesIdentity"
            };

            _connection = await factory.CreateConnectionAsync(cancellationToken);
            return _connection;
        }
        finally
        {
            _connectionLock.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_connection is not null)
            await _connection.DisposeAsync();

        _connectionLock.Dispose();
    }
}
