using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Services;

public interface IPlanAnalyticsService
{
    Task<PlanUsageSummary> GetUsageSummaryAsync(CancellationToken cancellationToken = default);
}

public record PlanUsageSummary(
    DateTime GeneratedAt,
    IReadOnlyList<PlanUsageDetail> Plans,
    int TotalActiveSubscribers,
    decimal MonthlyRecurringRevenue);

public record PlanUsageDetail(
    string PlanId,
    string PlanName,
    bool IsActive,
    int ActiveSubscribers,
    decimal MonthlyRecurringRevenue,
    decimal Price,
    string Currency,
    double ShareOfSubscribersPercent);
