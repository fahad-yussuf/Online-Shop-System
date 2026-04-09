using MarketplaceAPI.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace MarketplaceAPI.Services;

public class StockNotificationService
{
    private readonly IHubContext<StockHub> _hub;
    private readonly int _lowStockThreshold;

    public StockNotificationService(IHubContext<StockHub> hub, IConfiguration config)
    {
        _hub = hub;
        _lowStockThreshold = config.GetValue<int>("StockSettings:LowStockThreshold", 5);
    }

    public async Task NotifyStockUpdated(string productId, string productName, int newQuantity)
    {
        // Push to everyone watching this specific product
        await _hub.Clients.Group($"product-{productId}")
            .SendAsync("StockUpdated", new
            {
                productId,
                productName,
                newQuantity
            });

        // If stock just dropped below threshold, send a low stock alert to all sellers
        if (newQuantity <= _lowStockThreshold)
        {
            await _hub.Clients.All.SendAsync("LowStockAlert", new
            {
                productId,
                productName,
                quantity = newQuantity
            });
        }
    }

    public async Task NotifyNewOrder(int orderId, int sellerId, List<string> productIds)
    {
        // Notify the seller's group that a new order arrived
        await _hub.Clients.Group($"seller-{sellerId}")
            .SendAsync("NewOrder", new { orderId, productIds });
    }
}