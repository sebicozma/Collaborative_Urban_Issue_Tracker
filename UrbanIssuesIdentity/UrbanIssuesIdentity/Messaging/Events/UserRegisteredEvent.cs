namespace UrbanIssuesIdentity.Messaging.Events;

public sealed record UserRegisteredEvent(
    Guid           EventId,
    DateTimeOffset OccurredAt,
    string         UserId,
    string         Username,
    string         Email);
