namespace MarketplaceAPI.Models;

public class Inventory
{
    public int Id { get; set; }
    public string ProductId { get; set; } = string.Empty; // links to MongoDB
    public int SellerId { get; set; }
    public int Quantity { get; set; }
    public int LowStockThreshold { get; set; } = 5;

    [System.ComponentModel.DataAnnotations.Timestamp]
    public byte[] RowVersion { get; set; } = null!; // optimistic lock
}