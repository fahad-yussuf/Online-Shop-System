namespace MarketplaceAPI.Data;

public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = "MarketplaceDB";
    public string ProductsCollection { get; set; } = "products";
}