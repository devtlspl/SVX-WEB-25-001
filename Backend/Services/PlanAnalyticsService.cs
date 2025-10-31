using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class PlanAnalyticsService : IPlanAnalyticsService
{
    private readonly AppDbContext _dbContext;

    public PlanAnalyticsService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PlanUsageSummary> GetUsageSummaryAsync(CancellationToken cancellationToken = default)
    {
        var activeUsers = await _dbContext.Users
            .Where(u => u.IsSubscribed && u.ActivePlanId != null)
            .Select(u => new { u.ActivePlanId, u.ActivePlanAmount, u.ActivePlanCurrency })
            .ToListAsync(cancellationToken);

        var planLookup = await _dbContext.Plans
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        var grouped = activeUsers
            .GroupBy(u => u.ActivePlanId!)
            .Select(group =>
            {
                var plan = planLookup.TryGetValue(group.Key, out var value) ? value : null;
                var subscriberCount = group.Count();
                var mrr = group.Sum(u => u.ActivePlanAmount ?? plan?.Price ?? 0m);
                return new
                {
                    PlanId = group.Key,
                    Plan = plan,
                    Subscribers = subscriberCount,
                    Mrr = mrr
                };
            })
            .ToList();

        var totalSubscribers = grouped.Sum(g => g.Subscribers);
        var totalMrr = grouped.Sum(g => g.Mrr);

        var details = grouped
            .OrderByDescending(g => g.Subscribers)
            .ThenBy(g => g.Plan?.DisplayOrder ?? int.MaxValue)
            .Select(g => new PlanUsageDetail(
                PlanId: g.PlanId,
                PlanName: g.Plan?.Name ?? g.PlanId,
                IsActive: g.Plan?.IsActive ?? false,
                ActiveSubscribers: g.Subscribers,
                MonthlyRecurringRevenue: decimal.Round(g.Mrr, 2, MidpointRounding.AwayFromZero),
                Price: g.Plan?.Price ?? 0m,
                Currency: g.Plan?.Currency ?? "USD",
                ShareOfSubscribersPercent: totalSubscribers == 0 ? 0 : Math.Round((double)g.Subscribers / totalSubscribers * 100, 2)))
            .ToList();

        // Include plans with zero subscribers so admins can see catalog health.
        var plansWithoutSubscribers = planLookup.Values
            .Where(plan => details.All(detail => !string.Equals(detail.PlanId, plan.Id, StringComparison.OrdinalIgnoreCase)))
            .Select(plan => new PlanUsageDetail(
                PlanId: plan.Id,
                PlanName: plan.Name,
                IsActive: plan.IsActive && plan.ArchivedAt is null,
                ActiveSubscribers: 0,
                MonthlyRecurringRevenue: 0m,
                Price: plan.Price,
                Currency: plan.Currency,
                ShareOfSubscribersPercent: 0))
            .ToList();

        details.AddRange(plansWithoutSubscribers);

        return new PlanUsageSummary(
            GeneratedAt: DateTime.UtcNow,
            Plans: details.OrderBy(d => d.ActiveSubscribers == 0 ? 1 : 0).ThenByDescending(d => d.ActiveSubscribers).ToList(),
            TotalActiveSubscribers: totalSubscribers,
            MonthlyRecurringRevenue: decimal.Round(totalMrr, 2, MidpointRounding.AwayFromZero));
    }
}
