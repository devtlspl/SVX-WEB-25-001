using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Backend.Services;

public interface IUserAdministrationService
{
    Task<IReadOnlyList<AdminUserSummary>> GetUsersAsync(UserQueryOptions options, CancellationToken cancellationToken = default);
    Task<AdminUserDetail> GetUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task UpdateUserRolesAsync(Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken = default);
    Task UpdateUserPlanAsync(Guid userId, UpdateUserPlanRequest request, CancellationToken cancellationToken = default);
    Task UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default);
}

public record UserQueryOptions(string? Search, string? PlanId, bool IncludeInactive = true, int? Take = null);

public record AdminUserSummary(
    Guid Id,
    string Name,
    string Email,
    string PhoneNumber,
    bool IsSubscribed,
    string? ActivePlanId,
    string? ActivePlanName,
    DateTime? PaymentVerifiedAt,
    IReadOnlyList<string> Roles);

public record AdminUserDetail(
    Guid Id,
    string Name,
    string Email,
    string PhoneNumber,
    bool IsSubscribed,
    bool KycVerified,
    bool IsRegistrationComplete,
    DateTime? TermsAcceptedAt,
    DateTime? RiskPolicyAcceptedAt,
    string? ActivePlanId,
    string? ActivePlanName,
    decimal? ActivePlanAmount,
    string? ActivePlanCurrency,
    string? PendingPlanId,
    string? PendingPlanName,
    decimal? PendingPlanAmount,
    string? PendingPlanCurrency,
    IReadOnlyList<string> Roles,
    IReadOnlyList<AdminUserPlanHistoryItem> PlanHistory);

public record AdminUserPlanHistoryItem(
    string PlanId,
    string PlanName,
    string Status,
    decimal Amount,
    string Currency,
    DateTime SubscribedAt,
    DateTime? CancelledAt);

public record UpdateUserPlanRequest(
    string? PlanId,
    decimal? Amount,
    string? Currency,
    bool ResetPendingPlan);

public record UpdateUserStatusRequest(
    bool? IsSubscribed,
    bool? IsRegistrationComplete,
    bool? KycVerified);
