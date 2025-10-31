using System.Collections.Generic;
using Backend.Models;

namespace Backend.Services;

public interface IJwtService
{
    string GenerateToken(User user, string sessionId, IEnumerable<string>? roles = null);
}
