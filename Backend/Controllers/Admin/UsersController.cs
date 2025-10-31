using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers.Admin;

public class UsersController : AdminControllerBase
{
    private readonly IUserAdministrationService _userAdministrationService;
    private readonly IUserUsageService _userUsageService;
    private readonly IPasswordResetService _passwordResetService;

    public UsersController(
        IUserAdministrationService userAdministrationService,
        IUserUsageService userUsageService,
        IPasswordResetService passwordResetService)
    {
        _userAdministrationService = userAdministrationService;
        _userUsageService = userUsageService;
        _passwordResetService = passwordResetService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AdminUserSummaryResponse>>> GetUsers([FromQuery] UserSearchRequest request, CancellationToken cancellationToken = default)
    {
        var options = new UserQueryOptions(
            request.Search,
            request.PlanId,
            request.IncludeInactive ?? true,
            request.Take);

        var users = await _userAdministrationService.GetUsersAsync(options, cancellationToken);
        var response = users.Select(AdminUserSummaryResponse.FromSummary);
        return Ok(response);
    }

    [HttpGet("{userId:guid}")]
    public async Task<ActionResult<AdminUserDetailResponse>> GetUser(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userAdministrationService.GetUserAsync(userId, cancellationToken);
        return Ok(AdminUserDetailResponse.FromDetail(user));
    }

    [HttpPatch("{userId:guid}/roles")]
    public async Task<IActionResult> UpdateRoles(Guid userId, [FromBody] UpdateUserRolesRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        await _userAdministrationService.UpdateUserRolesAsync(userId, request.Roles ?? Array.Empty<string>(), cancellationToken);
        return NoContent();
    }

    [HttpPatch("{userId:guid}/plan")]
    public async Task<IActionResult> UpdatePlan(Guid userId, [FromBody] UpdateUserPlanRequestDto request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var updateRequest = new UpdateUserPlanRequest(
            request.PlanId,
            request.Amount,
            request.Currency,
            request.ResetPendingPlan ?? false);

        await _userAdministrationService.UpdateUserPlanAsync(userId, updateRequest, cancellationToken);
        return NoContent();
    }

    [HttpPatch("{userId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid userId, [FromBody] UpdateUserStatusRequestDto request, CancellationToken cancellationToken = default)
    {
        await _userAdministrationService.UpdateUserStatusAsync(userId, new UpdateUserStatusRequest(
            request.IsSubscribed,
            request.IsRegistrationComplete,
            request.KycVerified), cancellationToken);

        return NoContent();
    }

    [HttpGet("{userId:guid}/usage")]
    public async Task<ActionResult<UserUsageSummaryResponse>> GetUsage(Guid userId, CancellationToken cancellationToken = default)
    {
        var usage = await _userUsageService.GetUsageAsync(userId, cancellationToken);
        return Ok(UserUsageSummaryResponse.FromSummary(usage));
    }

    [HttpPost("{userId:guid}/password-reset")]
    public async Task<ActionResult<PasswordResetTokenResponse>> GeneratePasswordReset(
        Guid userId,
        [FromBody] GeneratePasswordResetRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var adminIdentifier = User.Identity?.Name
                              ?? User.FindFirstValue(ClaimTypes.Email)
                              ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                              ?? "admin-dashboard";

        TimeSpan? lifetime = null;
        if (request.LifetimeMinutes.HasValue)
        {
            lifetime = TimeSpan.FromMinutes(Math.Clamp(request.LifetimeMinutes.Value, 5, 60 * 24 * 7));
        }

        var result = await _passwordResetService.GenerateResetTokenAsync(
            userId,
            adminIdentifier,
            request.Reason,
            lifetime,
            cancellationToken);

        return Ok(new PasswordResetTokenResponse(
            result.TokenId,
            result.UserId,
            result.Token,
            result.ExpiresAt));
    }

    public record UserSearchRequest(
        string? Search,
        string? PlanId,
        bool? IncludeInactive,
        [property: Range(1, 500)] int? Take);

    public record UpdateUserRolesRequest(
        [property: Required] string[] Roles);

    public record UpdateUserPlanRequestDto(
        string? PlanId,
        [property: Range(0, double.MaxValue)] decimal? Amount,
        string? Currency,
        bool? ResetPendingPlan);

    public record UpdateUserStatusRequestDto(
        bool? IsSubscribed,
        bool? IsRegistrationComplete,
        bool? KycVerified);

    public record GeneratePasswordResetRequest(
        [property: Range(5, 10080)] int? LifetimeMinutes,
        [property: MaxLength(256)] string? Reason);

    public record AdminUserSummaryResponse(
        Guid Id,
        string Name,
        string Email,
        string PhoneNumber,
        bool IsSubscribed,
        string? ActivePlanId,
        string? ActivePlanName,
        DateTime? PaymentVerifiedAt,
        IReadOnlyList<string> Roles)
    {
        public static AdminUserSummaryResponse FromSummary(AdminUserSummary summary) =>
            new(
                summary.Id,
                summary.Name,
                summary.Email,
                summary.PhoneNumber,
                summary.IsSubscribed,
                summary.ActivePlanId,
                summary.ActivePlanName,
                summary.PaymentVerifiedAt,
                summary.Roles);
    }

    public record AdminUserDetailResponse(
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
        IReadOnlyList<AdminUserPlanHistoryItemResponse> PlanHistory)
    {
        public static AdminUserDetailResponse FromDetail(AdminUserDetail detail) =>
            new(
                detail.Id,
                detail.Name,
                detail.Email,
                detail.PhoneNumber,
                detail.IsSubscribed,
                detail.KycVerified,
                detail.IsRegistrationComplete,
                detail.TermsAcceptedAt,
                detail.RiskPolicyAcceptedAt,
                detail.ActivePlanId,
                detail.ActivePlanName,
                detail.ActivePlanAmount,
                detail.ActivePlanCurrency,
                detail.PendingPlanId,
                detail.PendingPlanName,
                detail.PendingPlanAmount,
                detail.PendingPlanCurrency,
                detail.Roles,
                detail.PlanHistory
                    .Select(item => new AdminUserPlanHistoryItemResponse(
                        item.PlanId,
                        item.PlanName,
                        item.Status,
                        item.Amount,
                        item.Currency,
                        item.SubscribedAt,
                        item.CancelledAt))
                    .ToList());
    }

    public record AdminUserPlanHistoryItemResponse(
        string PlanId,
        string PlanName,
        string Status,
        decimal Amount,
        string Currency,
        DateTime SubscribedAt,
        DateTime? CancelledAt);

    public record UserUsageSummaryResponse(
        Guid UserId,
        int TotalLogins,
        int ActiveSessions,
        double TotalScreenTimeMinutes,
        DateTime? LastLoginAt,
        int UniqueDeviceCount,
        IReadOnlyList<UserSessionSummaryResponse> RecentSessions)
    {
        public static UserUsageSummaryResponse FromSummary(UserUsageSummary summary) =>
            new(
                summary.UserId,
                summary.TotalLogins,
                summary.ActiveSessions,
                summary.TotalScreenTimeMinutes,
                summary.LastLoginAt,
                summary.UniqueDeviceCount,
                summary.RecentSessions
                    .Select(session => new UserSessionSummaryResponse(
                        session.SessionId,
                        session.SessionIdentifier,
                        session.LoginType,
                        session.CreatedAt,
                        session.LastSeenAt,
                        session.IpAddress,
                        session.LastSeenIpAddress,
                        session.DeviceName,
                        session.IsActive))
                    .ToList());
    }

    public record UserSessionSummaryResponse(
        Guid SessionId,
        string SessionIdentifier,
        string LoginType,
        DateTime CreatedAt,
        DateTime LastSeenAt,
        string? IpAddress,
        string? LastSeenIpAddress,
        string? DeviceName,
        bool IsActive);

    public record PasswordResetTokenResponse(
        Guid TokenId,
        Guid UserId,
        string Token,
        DateTime ExpiresAt);
}
