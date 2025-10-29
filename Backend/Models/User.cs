using System.ComponentModel.DataAnnotations;

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
}
