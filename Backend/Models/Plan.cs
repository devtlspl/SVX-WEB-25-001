using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class Plan
{
    [Key]
    [MaxLength(50)]
    public string Id { get; set; } = Guid.NewGuid().ToString("N");

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(256)]
    public string? Description { get; set; }

    [Precision(18, 2)]
    public decimal Price { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "USD";

    [MaxLength(20)]
    public string BillingInterval { get; set; } = "monthly";

    public bool IsActive { get; set; } = true;

    public int DisplayOrder { get; set; }

    [MaxLength(512)]
    public string? FeatureSummary { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ArchivedAt { get; set; }

    public ICollection<UserPlanHistory> PlanHistory { get; set; } = new List<UserPlanHistory>();
}
