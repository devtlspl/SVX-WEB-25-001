using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Backend.Models;

public class Invoice
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(50)]
    public string InvoiceNumber { get; set; } = string.Empty;

    [Required]
    public Guid UserId { get; set; }

    public User? User { get; set; }

    [MaxLength(50)]
    public string? PlanId { get; set; }

    [MaxLength(100)]
    public string? PlanName { get; set; }

    [Precision(18, 2)]
    public decimal Amount { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "INR";

    [MaxLength(100)]
    public string PaymentId { get; set; } = string.Empty;

    public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
}
