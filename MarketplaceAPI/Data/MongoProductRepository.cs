using MarketplaceAPI.Models;
using MongoDB.Driver;

namespace MarketplaceAPI.Data;

public class MongoProductRepository : IProductRepository
{
    private readonly IMongoCollection<Product> _products;

    public MongoProductRepository(IMongoClient client, MongoDbSettings settings)
    {
        var db = client.GetDatabase(settings.DatabaseName);
        _products = db.GetCollection<Product>(settings.ProductsCollection);
    }

    public async Task<List<Product>> GetAllAsync() =>
        await _products.Find(p => p.IsActive).ToListAsync();

    public async Task<List<Product>> GetBySellerAsync(int sellerId) =>
        await _products.Find(p => p.SellerId == sellerId).ToListAsync();

    public async Task<Product?> GetByIdAsync(string id) =>
        await _products.Find(p => p.Id == id).FirstOrDefaultAsync();

    public async Task<Product> CreateAsync(Product product)
    {
        await _products.InsertOneAsync(product);
        return product;
    }

    public async Task UpdateAsync(string id, Product product) =>
        await _products.ReplaceOneAsync(p => p.Id == id, product);

    public async Task DeleteAsync(string id) =>
        await _products.UpdateOneAsync(
            p => p.Id == id,
            Builders<Product>.Update.Set(p => p.IsActive, false));
}