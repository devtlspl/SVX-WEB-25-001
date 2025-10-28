using Backend.Models;

namespace Backend.Services;

public interface IAuthService
{
    Task<User> RegisterAsync(string name, string email, string password);
    Task<(User user, string token)> LoginAsync(string email, string password);
}
