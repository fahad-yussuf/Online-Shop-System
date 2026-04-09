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
public class ProductsController : ControllerBase
{
    private readonly ProductService _products;
    private readonly AppDbContext _db;

    public ProductsController(ProductService products, AppDbContext db)
    {
        _products = products;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _products.GetAllAsync());

    [HttpGet("with-stock")]
    public async Task<IActionResult> GetAllWithStock()
    {
        var products = await _products.GetAllAsync();
        var productIds = products.Select(p => p.Id).ToList();
        var inventories = await _db.Inventories
            .Where(i => productIds.Contains(i.ProductId))
            .ToListAsync();

        var result = products.Select(p => {
            var inv = inventories.FirstOrDefault(i => i.ProductId == p.Id);
            return new ProductWithStock(
                p.Id, p.Name, p.Description, p.Price,
                p.Category, p.SellerId, p.SellerName,
                p.Attributes, inv?.Quantity ?? 0);
        });

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var product = await _products.GetByIdAsync(id);
        return product == null ? NotFound() : Ok(product);
    }

    [Authorize(Roles = "Seller")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMine()
    {
        var sellerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return Ok(await _products.GetBySellerAsync(sellerId));
    }

    [Authorize(Roles = "Seller")]
    [HttpGet("my/with-stock")]
    public async Task<IActionResult> GetMineWithStock()
    {
        var sellerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var products = await _products.GetBySellerAsync(sellerId);
        var productIds = products.Select(p => p.Id).ToList();
        var inventories = await _db.Inventories
            .Where(i => productIds.Contains(i.ProductId) && i.SellerId == sellerId)
            .ToListAsync();

        var result = products.Select(p => {
            var inv = inventories.FirstOrDefault(i => i.ProductId == p.Id);
            return new ProductWithStock(
                p.Id, p.Name, p.Description, p.Price,
                p.Category, p.SellerId, p.SellerName,
                p.Attributes, inv?.Quantity ?? 0);
        });

        return Ok(result);
    }

    [Authorize(Roles = "Seller")]
    [HttpPost]
    public async Task<IActionResult> Create(Product product)
    {
        var sellerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var sellerName = User.FindFirstValue("name")!;
        var created = await _products.CreateAsync(product, sellerId, sellerName);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [Authorize(Roles = "Seller")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Product product)
    {
        var sellerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _products.UpdateAsync(id, product, sellerId)
            ? NoContent()
            : NotFound();
    }

    [Authorize(Roles = "Seller")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var sellerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        return await _products.DeleteAsync(id, sellerId)
            ? NoContent()
            : NotFound();
    }

    [Authorize(Roles = "Seller")]
    [HttpPatch("{productId}/stock")]
    public async Task<IActionResult> UpdateStock(string productId, [FromBody] UpdateStockRequest req)
    {
        var sellerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var inventory = await _db.Inventories
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.SellerId == sellerId);

        if (inventory == null)
            return NotFound(new { message = "Inventory not found" });

        inventory.Quantity = req.Quantity;
        await _db.SaveChangesAsync();
        return Ok(new { productId, inventory.Quantity });
    }

    public record UpdateStockRequest(int Quantity);
    public record ProductWithStock(
        string Id,
        string Name,
        string Description,
        decimal Price,
        string Category,
        int SellerId,
        string SellerName,
        Dictionary<string, string> Attributes,
        int Quantity
    );
}