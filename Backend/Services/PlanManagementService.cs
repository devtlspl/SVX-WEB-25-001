using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class PlanManagementService : IPlanManagementService
{
    private readonly AppDbContext _dbContext;

    public PlanManagementService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<Plan>> GetPlansAsync(bool includeArchived = false, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Plans.AsQueryable();
        if (!includeArchived)
        {
            query = query.Where(plan => plan.ArchivedAt == null && plan.IsActive);
        }

        return await query
            .OrderBy(plan => plan.DisplayOrder)
            .ThenBy(plan => plan.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Plan> GetPlanAsync(string planId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(planId);

        var plan = await _dbContext.Plans
            .SingleOrDefaultAsync(plan => plan.Id == planId, cancellationToken);

        return plan ?? throw new InvalidOperationException($"Plan '{planId}' was not found.");
    }

    public async Task<Plan> CreatePlanAsync(PlanDescriptor descriptor, CancellationToken cancellationToken = default)
    {
        var plan = new Plan
        {
            Id = GeneratePlanId(descriptor.Name),
            Name = descriptor.Name.Trim(),
            Description = descriptor.Description?.Trim(),
            Price = descriptor.Price,
            Currency = descriptor.Currency.Trim().ToUpperInvariant(),
            BillingInterval = descriptor.BillingInterval.Trim().ToLowerInvariant(),
            IsActive = descriptor.IsActive ?? true,
            DisplayOrder = descriptor.DisplayOrder ?? 0,
            FeatureSummary = descriptor.FeatureSummary?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        await ValidatePlanAsync(plan, cancellationToken);

        _dbContext.Plans.Add(plan);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return plan;
    }

    public async Task<Plan> UpdatePlanAsync(string planId, PlanDescriptor descriptor, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(planId);

        var plan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Id == planId, cancellationToken);
        if (plan is null)
        {
            throw new InvalidOperationException($"Plan '{planId}' was not found.");
        }

        if (!string.Equals(plan.Name, descriptor.Name, StringComparison.OrdinalIgnoreCase))
        {
            plan.Name = descriptor.Name.Trim();
        }

        plan.Description = descriptor.Description?.Trim();
        plan.Price = descriptor.Price;
        plan.Currency = descriptor.Currency.Trim().ToUpperInvariant();
        plan.BillingInterval = descriptor.BillingInterval.Trim().ToLowerInvariant();
        plan.IsActive = descriptor.IsActive ?? plan.IsActive;
        plan.DisplayOrder = descriptor.DisplayOrder ?? plan.DisplayOrder;
        plan.FeatureSummary = descriptor.FeatureSummary?.Trim();

        await ValidatePlanAsync(plan, cancellationToken, plan.Id);

        await _dbContext.SaveChangesAsync(cancellationToken);
        return plan;
    }

    public async Task ArchivePlanAsync(string planId, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(planId);

        var plan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Id == planId, cancellationToken);
        if (plan is null)
        {
            throw new InvalidOperationException($"Plan '{planId}' was not found.");
        }

        plan.IsActive = false;
        plan.ArchivedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<Plan> DuplicatePlanAsync(string sourcePlanId, string newPlanName, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sourcePlanId);
        ArgumentException.ThrowIfNullOrWhiteSpace(newPlanName);

        var sourcePlan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Id == sourcePlanId, cancellationToken);
        if (sourcePlan is null)
        {
            throw new InvalidOperationException($"Plan '{sourcePlanId}' was not found.");
        }

        var duplicate = new Plan
        {
            Id = GeneratePlanId(newPlanName),
            Name = newPlanName.Trim(),
            Description = sourcePlan.Description,
            Price = sourcePlan.Price,
            Currency = sourcePlan.Currency,
            BillingInterval = sourcePlan.BillingInterval,
            IsActive = true,
            DisplayOrder = sourcePlan.DisplayOrder + 1,
            FeatureSummary = sourcePlan.FeatureSummary,
            CreatedAt = DateTime.UtcNow
        };

        await ValidatePlanAsync(duplicate, cancellationToken);

        _dbContext.Plans.Add(duplicate);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return duplicate;
    }

    private static string GeneratePlanId(string name)
    {
        var cleaned = new string(name
            .Trim()
            .ToLowerInvariant()
            .Where(char.IsLetterOrDigit)
            .ToArray());

        return string.IsNullOrWhiteSpace(cleaned)
            ? $"plan-{Guid.NewGuid():N}"
            : cleaned;
    }

    private async Task ValidatePlanAsync(Plan plan, CancellationToken cancellationToken, string? existingPlanId = null)
    {
        if (plan.Price < 0)
        {
            throw new InvalidOperationException("Plan price cannot be negative.");
        }

        if (string.IsNullOrWhiteSpace(plan.Name))
        {
            throw new InvalidOperationException("Plan name is required.");
        }

        var nameConflict = await _dbContext.Plans
            .AnyAsync(p => p.Name == plan.Name && p.Id != existingPlanId, cancellationToken);

        if (nameConflict)
        {
            throw new InvalidOperationException($"A plan with the name '{plan.Name}' already exists.");
        }
    }
}
