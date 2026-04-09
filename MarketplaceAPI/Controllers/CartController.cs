using System.Security.Claims;
using MarketplaceAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MarketplaceAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly CartService _cart;
    public CartController(CartService cart) => _cart = cart;

    private int BuyerId =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get() =>
        Ok(await _cart.GetCartAsync(BuyerId));

    public record AddItemRequest(string ProductId, int Quantity);

    [HttpPost("add")]
    public async Task<IActionResult> Add(AddItemRequest req)
    {
        try
        {
            var cart = await _cart.AddItemAsync(BuyerId, req.ProductId, req.Quantity);
            return Ok(cart);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("remove/{productId}")]
    public async Task<IActionResult> Remove(string productId)
    {
        var cart = await _cart.RemoveItemAsync(BuyerId, productId);
        return Ok(cart);
    }

    [HttpDelete("clear")]
    public async Task<IActionResult> Clear()
    {
        await _cart.ClearAsync(BuyerId);
        return NoContent();
    }
}