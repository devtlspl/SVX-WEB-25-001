using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BillingController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public BillingController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("invoices")]
    public async Task<IActionResult> GetInvoices()
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        var invoices = await _dbContext.Invoices
            .Where(i => i.UserId == user.Id)
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.PlanName,
                i.PlanId,
                Amount = i.Amount,
                i.Currency,
                i.PaymentId,
                i.IssuedAt
            })
            .ToListAsync();

        return Ok(new { invoices });
    }

    [HttpGet("invoices/{invoiceId:guid}/download")]
    public async Task<IActionResult> DownloadInvoice(Guid invoiceId)
    {
        var user = await GetCurrentUserAsync();
        if (user is null)
        {
            return Unauthorized();
        }

        var invoice = await _dbContext.Invoices.SingleOrDefaultAsync(i => i.Id == invoiceId && i.UserId == user.Id);
        if (invoice is null)
        {
            return NotFound();
        }

        var builder = new StringBuilder();
        builder.AppendLine($"Invoice #: {invoice.InvoiceNumber}");
        builder.AppendLine($"Issued: {invoice.IssuedAt:yyyy-MM-dd HH:mm:ss} UTC");
        builder.AppendLine($"Customer: {user.Name}");
        builder.AppendLine($"Email: {user.Email}");
        builder.AppendLine($"Plan: {invoice.PlanName ?? "Growth"}");
        builder.AppendLine($"Amount: {invoice.Amount:F2} {invoice.Currency}");
        builder.AppendLine($"Payment ID: {invoice.PaymentId}");
        builder.AppendLine();
        builder.AppendLine("Thank you for trading with SVX Intelligence.");

        var bytes = Encoding.UTF8.GetBytes(builder.ToString());
        var fileName = $"invoice-{invoice.InvoiceNumber}.txt";

        return File(bytes, "text/plain", fileName);
    }

    private async Task<User?> GetCurrentUserAsync()
    {
        var userIdClaim = User.FindFirstValue(JwtRegisteredClaimNames.Sub) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim, out var userId))
        {
            return null;
        }

        return await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == userId);
    }
}
