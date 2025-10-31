using System;
using System.Linq;
using Backend.Data;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class UserUsageService : IUserUsageService
{
    private const int RecentSessionCount = 20;

    private readonly AppDbContext _dbContext;

    public UserUsageService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserUsageSummary> GetUsageAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var sessions = await _dbContext.UserSessions
            .Where(session => session.UserId == userId)
            .OrderByDescending(session => session.CreatedAt)
            .ToListAsync(cancellationToken);

        if (sessions.Count == 0)
        {
            return new UserUsageSummary(
                userId,
                0,
                0,
                0,
                null,
                0,
                Array.Empty<UserSessionSummary>());
        }

        var totalLogins = sessions.Count;
        var activeSessions = sessions.Count(session => session.IsActive);
        var lastLoginAt = sessions.Max(session => session.CreatedAt);

        double totalMinutes = sessions.Sum(session =>
        {
            var end = session.EndedAt ?? session.LastSeenAt;
            var duration = end - session.CreatedAt;
            return duration.TotalMinutes < 0 ? 0 : duration.TotalMinutes;
        });

        var deviceCount = sessions
            .Where(session => !string.IsNullOrWhiteSpace(session.DeviceSignature))
            .Select(session => session.DeviceSignature!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        var recentSessions = sessions
            .Take(RecentSessionCount)
            .Select(session => new UserSessionSummary(
                session.Id,
                session.SessionId,
                session.LoginType,
                session.CreatedAt,
                session.LastSeenAt,
                session.IpAddress,
                session.LastSeenIpAddress,
                session.DeviceName,
                session.IsActive))
            .ToList();

        return new UserUsageSummary(
            userId,
            totalLogins,
            activeSessions,
            Math.Round(totalMinutes, 2),
            lastLoginAt,
            deviceCount,
            recentSessions);
    }
}
