namespace UrbanIssuesIdentity.Messaging.Events;

public sealed record UserRegisteredEvent(
    Guid           EventId,
    DateTimeOffset EventTimeStamp,
    string         UserId,
    string         Email,
    string         Role);
