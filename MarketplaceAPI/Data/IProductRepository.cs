using MarketplaceAPI.Models;

namespace MarketplaceAPI.Data;

public interface IProductRepository
{
    Task<List<Product>> GetAllAsync();
    Task<List<Product>> GetBySellerAsync(int sellerId);
    Task<Product?> GetByIdAsync(string id);
    Task<Product> CreateAsync(Product product);
    Task UpdateAsync(string id, Product product);
    Task DeleteAsync(string id);
}