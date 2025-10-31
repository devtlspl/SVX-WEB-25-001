using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class UserPlanHistory
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = default!;

    [Required]
    [MaxLength(50)]
    public string PlanId { get; set; } = string.Empty;

    [ForeignKey(nameof(PlanId))]
    public Plan Plan { get; set; } = default!;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "active";

    [Precision(18, 2)]
    public decimal Amount { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "USD";

    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;

    public DateTime? CancelledAt { get; set; }

    [MaxLength(256)]
    public string? Notes { get; set; }
}
