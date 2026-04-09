using MarketplaceAPI.Data;
using MarketplaceAPI.Models;

namespace MarketplaceAPI.Services;

public class ProductService
{
    private readonly IProductRepository _products;
    private readonly AppDbContext _db;

    public ProductService(IProductRepository products, AppDbContext db)
    {
        _products = products;
        _db = db;
    }

    public Task<List<Product>> GetAllAsync() => _products.GetAllAsync();

    public Task<List<Product>> GetBySellerAsync(int sellerId) =>
        _products.GetBySellerAsync(sellerId);

    public Task<Product?> GetByIdAsync(string id) => _products.GetByIdAsync(id);

    public async Task<Product> CreateAsync(Product product, int sellerId, string sellerName)
    {
        product.SellerId = sellerId;
        product.SellerName = sellerName;

        var created = await _products.CreateAsync(product);

        // Auto-create inventory record in SQL Server
        _db.Inventories.Add(new Inventory
        {
            ProductId = created.Id,
            SellerId = sellerId,
            Quantity = 0
        });
        await _db.SaveChangesAsync();

        return created;
    }

    public async Task<bool> UpdateAsync(string id, Product product, int sellerId)
    {
        var existing = await _products.GetByIdAsync(id);
        if (existing == null || existing.SellerId != sellerId)
            return false;

        product.Id = id;
        product.SellerId = sellerId;
        product.SellerName = existing.SellerName;
        await _products.UpdateAsync(id, product);
        return true;
    }

    public async Task<bool> DeleteAsync(string id, int sellerId)
    {
        var existing = await _products.GetByIdAsync(id);
        if (existing == null || existing.SellerId != sellerId)
            return false;

        await _products.DeleteAsync(id);
        return true;
    }
}