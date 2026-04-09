using MarketplaceAPI.Data;
using MarketplaceAPI.Models;
using MarketplaceAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _auth;
    private readonly AppDbContext _db;

    public AuthController(AuthService auth, AppDbContext db)
    {
        _auth = auth;
        _db = db;
    }

    public record RegisterRequest(string Email, string Password, string Name, UserRole Role);
    public record LoginRequest(string Email, string Password);

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var user = await _auth.RegisterAsync(req.Email, req.Password, req.Name, req.Role);
        if (user == null)
            return Conflict(new { message = "Email already in use" });

        return Ok(new { user.Id, user.Email, user.Name, user.Role });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var token = await _auth.LoginAsync(req.Email, req.Password);
        if (token == null)
            return Unauthorized(new { message = "Invalid credentials" });

        return Ok(new { token });
    }

    [HttpPost("seed-admin")]
    public async Task<IActionResult> SeedAdmin()
    {
        var existing = await _db.Users.AnyAsync(u => u.Role == UserRole.Admin);
        if (existing)
            return Conflict(new { message = "Admin already exists" });

        var user = await _auth.RegisterAsync(
            "admin@marketplace.com",
            "Admin123!",
            "Admin",
            UserRole.Admin);

        return Ok(new { message = "Admin created", user?.Email });
    }
}