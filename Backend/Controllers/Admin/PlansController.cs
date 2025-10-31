using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Admin;

public class PlansController : AdminControllerBase
{
    private readonly IPlanManagementService _planManagementService;
    private readonly IPlanAnalyticsService _planAnalyticsService;

    public PlansController(
        IPlanManagementService planManagementService,
        IPlanAnalyticsService planAnalyticsService)
    {
        _planManagementService = planManagementService;
        _planAnalyticsService = planAnalyticsService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PlanAdminResponse>>> GetPlans([FromQuery] bool includeArchived = false, CancellationToken cancellationToken = default)
    {
        var plans = await _planManagementService.GetPlansAsync(includeArchived, cancellationToken);
        return Ok(plans.Select(PlanAdminResponse.FromModel));
    }

    [HttpGet("{planId}")]
    public async Task<ActionResult<PlanAdminResponse>> GetPlan(string planId, CancellationToken cancellationToken = default)
    {
        var plan = await _planManagementService.GetPlanAsync(planId, cancellationToken);
        return Ok(PlanAdminResponse.FromModel(plan));
    }

    [HttpPost]
    public async Task<ActionResult<PlanAdminResponse>> CreatePlan([FromBody] UpsertPlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var descriptor = request.ToDescriptor();
        var plan = await _planManagementService.CreatePlanAsync(descriptor, cancellationToken);
        return CreatedAtAction(nameof(GetPlan), new { planId = plan.Id }, PlanAdminResponse.FromModel(plan));
    }

    [HttpPut("{planId}")]
    public async Task<ActionResult<PlanAdminResponse>> UpdatePlan(string planId, [FromBody] UpsertPlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var descriptor = request.ToDescriptor();
        var plan = await _planManagementService.UpdatePlanAsync(planId, descriptor, cancellationToken);
        return Ok(PlanAdminResponse.FromModel(plan));
    }

    [HttpPatch("{planId}/archive")]
    public async Task<IActionResult> ArchivePlan(string planId, CancellationToken cancellationToken = default)
    {
        await _planManagementService.ArchivePlanAsync(planId, cancellationToken);
        return NoContent();
    }

    [HttpPost("{planId}/duplicate")]
    public async Task<ActionResult<PlanAdminResponse>> DuplicatePlan(string planId, [FromBody] DuplicatePlanRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var duplicate = await _planManagementService.DuplicatePlanAsync(planId, request.Name, cancellationToken);

        if (request.OverrideValues is not null)
        {
            var descriptor = request.OverrideValues.ToDescriptor();
            duplicate = await _planManagementService.UpdatePlanAsync(duplicate.Id, descriptor, cancellationToken);
        }

        return CreatedAtAction(nameof(GetPlan), new { planId = duplicate.Id }, PlanAdminResponse.FromModel(duplicate));
    }

    [HttpGet("usage")]
    public async Task<ActionResult<PlanUsageSummaryResponse>> GetUsageSummary(CancellationToken cancellationToken = default)
    {
        var summary = await _planAnalyticsService.GetUsageSummaryAsync(cancellationToken);
        return Ok(PlanUsageSummaryResponse.FromSummary(summary));
    }

    public record UpsertPlanRequest(
        [property: Required, MaxLength(100)] string Name,
        [property: MaxLength(256)] string? Description,
        [property: Range(0, double.MaxValue)] decimal Price,
        [property: Required, MaxLength(10)] string Currency,
        [property: Required, MaxLength(20)] string BillingInterval,
        bool? IsActive,
        int? DisplayOrder,
        [property: MaxLength(512)] string? FeatureSummary)
    {
        public PlanDescriptor ToDescriptor() =>
            new(
                Name,
                Description,
                Price,
                Currency,
                BillingInterval,
                IsActive,
                DisplayOrder,
                FeatureSummary);
    }

    public record DuplicatePlanRequest(
        [property: Required, MaxLength(100)] string Name,
        UpsertPlanRequest? OverrideValues);

    public record PlanAdminResponse(
        string Id,
        string Name,
        string? Description,
        decimal Price,
        string Currency,
        string BillingInterval,
        bool IsActive,
        int DisplayOrder,
        string? FeatureSummary,
        DateTime CreatedAt,
        DateTime? ArchivedAt)
    {
        public static PlanAdminResponse FromModel(Plan plan) =>
            new(
                plan.Id,
                plan.Name,
                plan.Description,
                plan.Price,
                plan.Currency,
                plan.BillingInterval,
                plan.IsActive && plan.ArchivedAt is null,
                plan.DisplayOrder,
                plan.FeatureSummary,
                plan.CreatedAt,
                plan.ArchivedAt);
    }

    public record PlanUsageSummaryResponse(
        DateTime GeneratedAt,
        int TotalActiveSubscribers,
        decimal MonthlyRecurringRevenue,
        IReadOnlyList<PlanUsageDetailResponse> Plans)
    {
        public static PlanUsageSummaryResponse FromSummary(PlanUsageSummary summary) =>
            new PlanUsageSummaryResponse(
                summary.GeneratedAt,
                summary.TotalActiveSubscribers,
                summary.MonthlyRecurringRevenue,
                summary.Plans
                    .Select(detail => new PlanUsageDetailResponse(
                        detail.PlanId,
                        detail.PlanName,
                        detail.IsActive,
                        detail.ActiveSubscribers,
                        detail.MonthlyRecurringRevenue,
                        detail.Price,
                        detail.Currency,
                        detail.ShareOfSubscribersPercent))
                    .ToList());
    }

    public record PlanUsageDetailResponse(
        string PlanId,
        string PlanName,
        bool IsActive,
        int ActiveSubscribers,
        decimal MonthlyRecurringRevenue,
        decimal Price,
        string Currency,
        double ShareOfSubscribersPercent);
}
