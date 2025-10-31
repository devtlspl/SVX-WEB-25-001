using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class User
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = default!;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = default!;

    [Required]
    [Phone]
    [MaxLength(20)]
    public string PhoneNumber { get; set; } = default!;

    [Required]
    public string PasswordHash { get; set; } = default!;

    [MaxLength(50)]
    public string? GovernmentIdType { get; set; }

    [MaxLength(100)]
    public string? GovernmentIdNumber { get; set; }

    [MaxLength(256)]
    public string? GovernmentDocumentUrl { get; set; }

    public bool KycVerified { get; set; }

    public bool IsSubscribed { get; set; }

    public bool IsRegistrationComplete { get; set; }

    public DateTime? PaymentVerifiedAt { get; set; }

    public bool IsAdmin { get; set; }

    [MaxLength(100)]
    public string? SubscriptionId { get; set; }

    [MaxLength(100)]
    public string? CurrentSessionId { get; set; }

    [MaxLength(100)]
    public string? PendingOrderId { get; set; }

    [MaxLength(50)]
    public string? ActivePlanId { get; set; }

    [ForeignKey(nameof(ActivePlanId))]
    public Plan? ActivePlan { get; set; }

    [MaxLength(100)]
    public string? ActivePlanName { get; set; }

    [Precision(18, 2)]
    public decimal? ActivePlanAmount { get; set; }

    [MaxLength(10)]
    public string? ActivePlanCurrency { get; set; }

    [MaxLength(50)]
    public string? PendingPlanId { get; set; }

    [ForeignKey(nameof(PendingPlanId))]
    public Plan? PendingPlan { get; set; }

    [MaxLength(100)]
    public string? PendingPlanName { get; set; }

    [Precision(18, 2)]
    public decimal? PendingPlanAmount { get; set; }

    [MaxLength(10)]
    public string? PendingPlanCurrency { get; set; }

    public DateTime? TermsAcceptedAt { get; set; }

    public DateTime? RiskPolicyAcceptedAt { get; set; }

    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    public ICollection<UserPlanHistory> PlanHistory { get; set; } = new List<UserPlanHistory>();

    public ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();

    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = new List<PasswordResetToken>();
}
