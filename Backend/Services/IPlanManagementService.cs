using System.Threading;
using System.Threading.Tasks;
using Backend.Models;

namespace Backend.Services;

public interface IPlanManagementService
{
    Task<IReadOnlyList<Plan>> GetPlansAsync(bool includeArchived = false, CancellationToken cancellationToken = default);
    Task<Plan> GetPlanAsync(string planId, CancellationToken cancellationToken = default);
    Task<Plan> CreatePlanAsync(PlanDescriptor descriptor, CancellationToken cancellationToken = default);
    Task<Plan> UpdatePlanAsync(string planId, PlanDescriptor descriptor, CancellationToken cancellationToken = default);
    Task ArchivePlanAsync(string planId, CancellationToken cancellationToken = default);
    Task<Plan> DuplicatePlanAsync(string sourcePlanId, string newPlanName, CancellationToken cancellationToken = default);
}

public record PlanDescriptor(
    string Name,
    string? Description,
    decimal Price,
    string Currency,
    string BillingInterval,
    bool? IsActive = null,
    int? DisplayOrder = null,
    string? FeatureSummary = null);
