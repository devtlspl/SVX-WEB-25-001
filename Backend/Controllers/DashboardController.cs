using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public DashboardController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [Authorize]
    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null || !Guid.TryParse(userId, out var parsedId))
        {
            return Unauthorized();
        }

        var user = await _dbContext.Users.SingleOrDefaultAsync(u => u.Id == parsedId);
        if (user is null)
        {
            return NotFound();
        }

        if (!user.IsSubscribed)
        {
            return Forbid();
        }

        var response = new
        {
            Company = "SVX Analytics Suite",
            Summary = "Centralised dashboard giving your team real-time subscription intelligence.",
            Metrics = new[]
            {
                new { Label = "Active Licenses", Value = "1280", Trend = "+12%" },
                new { Label = "API Throughput (req/min)", Value = "764", Trend = "+5%" },
                new { Label = "Support SLA", Value = "99.3%", Trend = "steady" }
            },
            Updates = new[]
            {
                "AI assisted forecasting rolled out to subscribed partners.",
                "New data residency controls available in the compliance centre.",
                "Webhook retries now configurable from the automation tab."
            }
        };

        return Ok(response);
    }
}
