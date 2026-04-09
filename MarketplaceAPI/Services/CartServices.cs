using MarketplaceAPI.Data;
using MarketplaceAPI.Models;

namespace MarketplaceAPI.Services;

public class CartService
{
    private readonly ICartRepository _carts;
    private readonly IProductRepository _products;

    public CartService(ICartRepository carts, IProductRepository products)
    {
        _carts = carts;
        _products = products;
    }

    public async Task<Cart> GetCartAsync(int buyerId)
    {
        return await _carts.GetByBuyerAsync(buyerId)
            ?? new Cart { BuyerId = buyerId };
    }

    public async Task<Cart> AddItemAsync(int buyerId, string productId, int quantity)
    {
        var product = await _products.GetByIdAsync(productId);
        if (product == null) throw new Exception("Product not found");

        var cart = await GetCartAsync(buyerId);
        var existing = cart.Items.FirstOrDefault(i => i.ProductId == productId);

        if (existing != null)
            existing.Quantity += quantity;
        else
            cart.Items.Add(new CartItem
            {
                ProductId = productId,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = quantity
            });

        cart.UpdatedAt = DateTime.UtcNow;
        await _carts.SaveAsync(cart);
        return cart;
    }

    public async Task<Cart> RemoveItemAsync(int buyerId, string productId)
    {
        var cart = await GetCartAsync(buyerId);
        cart.Items.RemoveAll(i => i.ProductId == productId);
        cart.UpdatedAt = DateTime.UtcNow;
        await _carts.SaveAsync(cart);
        return cart;
    }

    public async Task ClearAsync(int buyerId) =>
        await _carts.ClearAsync(buyerId);
}