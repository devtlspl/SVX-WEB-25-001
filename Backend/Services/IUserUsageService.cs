using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Services;

public interface IUserUsageService
{
    Task<UserUsageSummary> GetUsageAsync(Guid userId, CancellationToken cancellationToken = default);
}

public record UserUsageSummary(
    Guid UserId,
    int TotalLogins,
    int ActiveSessions,
    double TotalScreenTimeMinutes,
    DateTime? LastLoginAt,
    int UniqueDeviceCount,
    IReadOnlyList<UserSessionSummary> RecentSessions);

public record UserSessionSummary(
    Guid SessionId,
    string SessionIdentifier,
    string LoginType,
    DateTime CreatedAt,
    DateTime LastSeenAt,
    string? IpAddress,
    string? LastSeenIpAddress,
    string? DeviceName,
    bool IsActive);
