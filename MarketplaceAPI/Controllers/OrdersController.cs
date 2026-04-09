using System.Security.Claims;
using MarketplaceAPI.Models;
using MarketplaceAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orders;
    public OrdersController(OrderService orders) => _orders = orders;

    private int UserId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private bool IsSeller =>
        User.FindFirstValue(ClaimTypes.Role) == "Seller";

    [HttpPost]
    public async Task<IActionResult> PlaceOrder()
    {
        try
        {
            var order = await _orders.PlaceOrderAsync(UserId);
            return Ok(order);
        }
        catch (InvalidOrderStateException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyOrders() =>
        Ok(await _orders.GetBuyerOrdersAsync(UserId));

    [HttpGet("seller")]
    [Authorize(Roles = "Seller")]
    public async Task<IActionResult> GetSellerOrders() =>
        Ok(await _orders.GetSellerOrdersAsync(UserId));

    public record StatusRequest(OrderStatus NewStatus);

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> AdvanceStatus(int id, StatusRequest req)
    {
        try
        {
            var order = await _orders.AdvanceStatusAsync(id, req.NewStatus, UserId, IsSeller);
            return Ok(order);
        }
        catch (InvalidOrderStateException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}