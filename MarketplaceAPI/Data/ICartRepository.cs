using MarketplaceAPI.Models;

namespace MarketplaceAPI.Data;

public interface ICartRepository
{
    Task<Cart?> GetByBuyerAsync(int buyerId);
    Task SaveAsync(Cart cart);
    Task ClearAsync(int buyerId);
}