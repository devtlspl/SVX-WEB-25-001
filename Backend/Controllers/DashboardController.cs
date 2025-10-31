using System;
using System.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Authorization;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public DashboardController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [Authorize(Policy = AuthorizationPolicies.UserOrAdmin)]
    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null || !Guid.TryParse(userId, out var parsedId))
        {
            return Unauthorized();
        }

        var user = await _dbContext.Users
            .Include(u => u.ActivePlan)
            .Include(u => u.PendingPlan)
            .SingleOrDefaultAsync(u => u.Id == parsedId);
        if (user is null)
        {
            return NotFound();
        }

        var recentPlans = await _dbContext.UserPlanHistories
            .Where(history => history.UserId == parsedId)
            .OrderByDescending(history => history.SubscribedAt)
            .Take(5)
            .Select(history => new
            {
                history.PlanId,
                PlanName = history.Plan.Name,
                history.Status,
                history.Amount,
                history.Currency,
                history.SubscribedAt,
                history.CancelledAt
            })
            .ToListAsync();

        var totalInvoices = await _dbContext.Invoices.CountAsync(invoice => invoice.UserId == parsedId);
        var activeSubscriptionDays = user.PaymentVerifiedAt is null
            ? 0
            : (int)Math.Max(0, (DateTime.UtcNow - user.PaymentVerifiedAt.Value).TotalDays);

        var response = new
        {
            Account = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.IsSubscribed,
                user.IsRegistrationComplete,
                user.KycVerified,
                Roles = User.FindAll(ClaimTypes.Role).Select(claim => claim.Value).Distinct().ToArray()
            },
            ActivePlan = user.ActivePlan is null && string.IsNullOrWhiteSpace(user.ActivePlanId)
                ? null
                : new
                {
                    PlanId = user.ActivePlan?.Id ?? user.ActivePlanId,
                    PlanName = user.ActivePlan?.Name ?? user.ActivePlanName,
                    user.ActivePlanAmount,
                    user.ActivePlanCurrency,
                    user.PaymentVerifiedAt,
                    ActiveDays = activeSubscriptionDays
                },
            PendingPlan = user.PendingPlan is null && string.IsNullOrWhiteSpace(user.PendingPlanId)
                ? null
                : new
                {
                    PlanId = user.PendingPlan?.Id ?? user.PendingPlanId,
                    PlanName = user.PendingPlan?.Name ?? user.PendingPlanName,
                    user.PendingPlanAmount,
                    user.PendingPlanCurrency
            },
            Metrics = new[]
            {
                new { Label = "Total Invoices", Value = totalInvoices.ToString("N0") },
                new { Label = "Current Plan", Value = user.ActivePlan?.Name ?? user.ActivePlanName ?? "Unassigned" },
                new { Label = "Subscription ID", Value = user.SubscriptionId ?? "Pending" }
            },
            RecentPlans = recentPlans.Select(plan => new
            {
                plan.PlanId,
                plan.PlanName,
                plan.Status,
                plan.Amount,
                plan.Currency,
                plan.SubscribedAt,
                plan.CancelledAt
            })
        };

        return Ok(response);
    }
}
