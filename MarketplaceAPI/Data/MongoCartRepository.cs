using MarketplaceAPI.Models;
using MongoDB.Driver;

namespace MarketplaceAPI.Data;

public class MongoCartRepository : ICartRepository
{
    private readonly IMongoCollection<Cart> _carts;

    public MongoCartRepository(IMongoClient client, MongoDbSettings settings)
    {
        var db = client.GetDatabase(settings.DatabaseName);
        _carts = db.GetCollection<Cart>("carts");
    }

    public async Task<Cart?> GetByBuyerAsync(int buyerId) =>
        await _carts.Find(c => c.BuyerId == buyerId).FirstOrDefaultAsync();

    public async Task SaveAsync(Cart cart)
{
    var filter = Builders<Cart>.Filter.Eq(c => c.BuyerId, cart.BuyerId);
    var options = new ReplaceOptions { IsUpsert = true };
    await _carts.ReplaceOneAsync(filter, cart, options);
}

    public async Task ClearAsync(int buyerId) =>
        await _carts.DeleteOneAsync(c => c.BuyerId == buyerId);
}