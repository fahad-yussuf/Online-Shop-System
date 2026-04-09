using System.Security.Claims;
using MarketplaceAPI.Data;
using MarketplaceAPI.Models;
using MarketplaceAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IProductRepository _products;

    public AdminController(AppDbContext db, IProductRepository products)
    {
        _db = db;
        _products = products;
    }

    // Get all users
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers() =>
        Ok(await _db.Users
            .Select(u => new { u.Id, u.Email, u.Name, u.Role, u.IsActive, u.CreatedAt })
            .ToListAsync());

    // Deactivate a seller account
    [HttpPatch("users/{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = false;
        await _db.SaveChangesAsync();
        return Ok(new { message = $"User {user.Email} deactivated" });
    }

    // Reactivate a user account
    [HttpPatch("users/{id}/activate")]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsActive = true;
        await _db.SaveChangesAsync();
        return Ok(new { message = $"User {user.Email} activated" });
    }

    // Get all orders with filter
    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
    {
        var query = _db.Orders.Include(o => o.Items).AsQueryable();

        if (!string.IsNullOrEmpty(status) &&
            Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
        {
            query = query.Where(o => o.Status == orderStatus);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders);
    }

    // Cancel any order as admin
    [HttpPatch("orders/{id}/cancel")]
    public async Task<IActionResult> CancelOrder(int id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();
        if (order.Status == OrderStatus.Fulfilled)
            return BadRequest(new { message = "Cannot cancel a fulfilled order" });

        // Restore stock
        foreach (var item in order.Items)
        {
            var inventory = await _db.Inventories
                .FirstOrDefaultAsync(i => i.ProductId == item.ProductId);
            if (inventory != null)
                inventory.Quantity += item.Quantity;
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { message = $"Order #{id} cancelled" });
    }

    // Get platform stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalUsers = await _db.Users.CountAsync();
        var totalOrders = await _db.Orders.CountAsync();
        var totalProducts = await _db.Inventories.CountAsync();
        var pendingOrders = await _db.Orders
            .CountAsync(o => o.Status == OrderStatus.Pending);
        var fulfilledOrders = await _db.Orders
            .CountAsync(o => o.Status == OrderStatus.Fulfilled);

        return Ok(new
        {
            totalUsers,
            totalOrders,
            totalProducts,
            pendingOrders,
            fulfilledOrders
        });
    }
}