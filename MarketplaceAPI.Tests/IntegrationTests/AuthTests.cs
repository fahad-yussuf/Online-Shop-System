using MarketplaceAPI.Data;
using MarketplaceAPI.Models;
using MarketplaceAPI.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace MarketplaceAPI.Tests.IntegrationTests;

public class AuthTests
{
    private AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("AuthTestDb_" + Guid.NewGuid())
            .Options;
        return new AppDbContext(options);
    }

    private IConfiguration CreateConfig() =>
        new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt__Key"] = "test_secret_key_32_characters_long_x",
                ["Jwt__Issuer"] = "MarketplaceAPI"
            })
            .Build();

    [Fact]
    public async Task Register_WithValidData_CreatesUser()
    {
        var db = CreateInMemoryDb();
        var service = new AuthService(db, CreateConfig());

        var user = await service.RegisterAsync(
            "test@test.com", "Test123!", "Test User", UserRole.Buyer);

        Assert.NotNull(user);
        Assert.Equal("test@test.com", user.Email);
        Assert.Equal(UserRole.Buyer, user.Role);
    }

    [Fact]
    public async Task Register_DuplicateEmail_ReturnsNull()
    {
        var db = CreateInMemoryDb();
        var service = new AuthService(db, CreateConfig());

        await service.RegisterAsync("dupe@test.com", "Test123!", "User1", UserRole.Buyer);
        var result = await service.RegisterAsync("dupe@test.com", "Test123!", "User2", UserRole.Buyer);

        Assert.Null(result);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        var db = CreateInMemoryDb();
        var service = new AuthService(db, CreateConfig());

        await service.RegisterAsync("login@test.com", "Test123!", "Test User", UserRole.Buyer);
        var token = await service.LoginAsync("login@test.com", "Test123!");

        Assert.NotNull(token);
        Assert.StartsWith("eyJ", token); // JWT tokens always start with eyJ
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsNull()
    {
        var db = CreateInMemoryDb();
        var service = new AuthService(db, CreateConfig());

        await service.RegisterAsync("wrong@test.com", "Test123!", "Test User", UserRole.Buyer);
        var token = await service.LoginAsync("wrong@test.com", "wrongpassword");

        Assert.Null(token);
    }
}