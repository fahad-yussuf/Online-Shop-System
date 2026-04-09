namespace MarketplaceAPI.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string ProductId { get; set; } = string.Empty; // MongoDB ObjectId as string
    public string ProductName { get; set; } = string.Empty; // snapshot at time of order
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}