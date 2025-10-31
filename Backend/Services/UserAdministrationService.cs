using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class UserAdministrationService : IUserAdministrationService
{
    private const string AdminRoleId = "admin";
    private const string DefaultUserRoleId = "user";

    private readonly AppDbContext _dbContext;

    public UserAdministrationService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<AdminUserSummary>> GetUsersAsync(UserQueryOptions options, CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Users.AsNoTracking();

        if (!options.IncludeInactive)
        {
            query = query.Where(user => user.IsSubscribed);
        }

        if (!string.IsNullOrWhiteSpace(options.Search))
        {
            var term = options.Search.Trim().ToLowerInvariant();
            query = query.Where(user =>
                user.Name.ToLower().Contains(term) ||
                user.Email.ToLower().Contains(term) ||
                user.PhoneNumber.ToLower().Contains(term));
        }

        if (!string.IsNullOrWhiteSpace(options.PlanId))
        {
            query = query.Where(user => user.ActivePlanId == options.PlanId);
        }

        query = query.OrderByDescending(user => user.PaymentVerifiedAt ?? DateTime.MinValue)
                     .ThenBy(user => user.Name);

        if (options.Take.HasValue && options.Take.Value > 0)
        {
            query = query.Take(options.Take.Value);
        }

        var users = await query.ToListAsync(cancellationToken);
        var userIds = users.Select(user => user.Id).ToArray();

        var rolesLookup = await _dbContext.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .Include(ur => ur.Role)
            .ToListAsync(cancellationToken);

        return users
            .Select(user =>
            {
                var roles = rolesLookup
                    .Where(role => role.UserId == user.Id)
                    .Select(role => role.Role?.Name ?? role.RoleId)
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList()
                    .AsReadOnly();

                return new AdminUserSummary(
                    user.Id,
                    user.Name,
                    user.Email,
                    user.PhoneNumber,
                    user.IsSubscribed,
                    user.ActivePlanId,
                    user.ActivePlanName,
                    user.PaymentVerifiedAt,
                    roles);
            })
            .ToList();
    }

    public async Task<AdminUserDetail> GetUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .Include(u => u.ActivePlan)
            .Include(u => u.PendingPlan)
            .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user is null)
        {
            throw new InvalidOperationException("User was not found.");
        }

        var roles = await _dbContext.UserRoles
            .Where(ur => ur.UserId == userId)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role!.Name)
            .Distinct()
            .ToListAsync(cancellationToken);

        var history = await _dbContext.UserPlanHistories
            .Where(historyItem => historyItem.UserId == userId)
            .OrderByDescending(historyItem => historyItem.SubscribedAt)
            .Include(historyItem => historyItem.Plan)
            .Select(historyItem => new AdminUserPlanHistoryItem(
                historyItem.PlanId,
                historyItem.Plan.Name,
                historyItem.Status,
                historyItem.Amount,
                historyItem.Currency,
                historyItem.SubscribedAt,
                historyItem.CancelledAt))
            .ToListAsync(cancellationToken);

        return new AdminUserDetail(
            user.Id,
            user.Name,
            user.Email,
            user.PhoneNumber,
            user.IsSubscribed,
            user.KycVerified,
            user.IsRegistrationComplete,
            user.TermsAcceptedAt,
            user.RiskPolicyAcceptedAt,
            user.ActivePlanId,
            user.ActivePlanName ?? user.ActivePlan?.Name,
            user.ActivePlanAmount,
            user.ActivePlanCurrency ?? user.ActivePlan?.Currency,
            user.PendingPlanId,
            user.PendingPlanName ?? user.PendingPlan?.Name,
            user.PendingPlanAmount,
            user.PendingPlanCurrency ?? user.PendingPlan?.Currency,
            roles.AsReadOnly(),
            history.AsReadOnly());
    }

    public async Task UpdateUserRolesAsync(Guid userId, IEnumerable<string> roles, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User was not found.");
        }

        var desiredRoleSet = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var role in roles ?? Array.Empty<string>())
        {
            if (!string.IsNullOrWhiteSpace(role))
            {
                desiredRoleSet.Add(role.Trim().ToLowerInvariant());
            }
        }
        desiredRoleSet.Add(DefaultUserRoleId);

        var validRoleIds = await _dbContext.Roles
            .Where(role => desiredRoleSet.Contains(role.Id))
            .Select(role => role.Id)
            .ToListAsync(cancellationToken);

        var existingRoleAssignments = await _dbContext.UserRoles
            .Where(ur => ur.UserId == userId)
            .ToListAsync(cancellationToken);

        foreach (var assignment in existingRoleAssignments)
        {
            if (!desiredRoleSet.Contains(assignment.RoleId))
            {
                _dbContext.UserRoles.Remove(assignment);
            }
        }

        var existingRoleIds = new HashSet<string>(existingRoleAssignments.Select(ur => ur.RoleId), StringComparer.OrdinalIgnoreCase);

        foreach (var roleId in validRoleIds)
        {
            if (!existingRoleIds.Contains(roleId))
            {
                _dbContext.UserRoles.Add(new UserRole
                {
                    UserId = userId,
                    RoleId = roleId,
                    GrantedBy = "admin"
                });
            }
        }

        user.IsAdmin = desiredRoleSet.Contains(AdminRoleId);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateUserPlanAsync(Guid userId, UpdateUserPlanRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User was not found.");
        }

        if (request.ResetPendingPlan)
        {
            user.PendingPlanId = null;
            user.PendingPlanName = null;
            user.PendingPlanAmount = null;
            user.PendingPlanCurrency = null;
        }

        if (string.IsNullOrWhiteSpace(request.PlanId))
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        var plan = await _dbContext.Plans.SingleOrDefaultAsync(p => p.Id == request.PlanId, cancellationToken);
        if (plan is null)
        {
            throw new InvalidOperationException($"Plan '{request.PlanId}' was not found.");
        }

        var newAmount = request.Amount ?? plan.Price;
        var newCurrency = string.IsNullOrWhiteSpace(request.Currency) ? plan.Currency : request.Currency.Trim().ToUpperInvariant();

        user.ActivePlanId = plan.Id;
        user.ActivePlanName = plan.Name;
        user.ActivePlanAmount = newAmount;
        user.ActivePlanCurrency = newCurrency;
        user.IsSubscribed = true;
        user.PaymentVerifiedAt ??= DateTime.UtcNow;

        var activeHistories = await _dbContext.UserPlanHistories
            .Where(history => history.UserId == userId && history.Status == "active")
            .ToListAsync(cancellationToken);

        foreach (var history in activeHistories)
        {
            history.Status = "ended";
            history.CancelledAt = DateTime.UtcNow;
        }

        _dbContext.UserPlanHistories.Add(new UserPlanHistory
        {
            UserId = userId,
            PlanId = plan.Id,
            Status = "active",
            Amount = newAmount,
            Currency = newCurrency,
            SubscribedAt = DateTime.UtcNow,
            Notes = "Plan manually updated via admin dashboard."
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateUserStatusAsync(Guid userId, UpdateUserStatusRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);
        if (user is null)
        {
            throw new InvalidOperationException("User was not found.");
        }

        if (request.IsSubscribed.HasValue)
        {
            user.IsSubscribed = request.IsSubscribed.Value;
        }

        if (request.IsRegistrationComplete.HasValue)
        {
            user.IsRegistrationComplete = request.IsRegistrationComplete.Value;
        }

        if (request.KycVerified.HasValue)
        {
            user.KycVerified = request.KycVerified.Value;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
