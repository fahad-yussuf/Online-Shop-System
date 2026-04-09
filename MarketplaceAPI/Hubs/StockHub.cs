using Microsoft.AspNetCore.SignalR;

namespace MarketplaceAPI.Hubs;

public class StockHub : Hub
{
    public async Task WatchProduct(string productId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"product-{productId}");
    }

    public async Task UnwatchProduct(string productId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"product-{productId}");
    }

    public async Task JoinSellerGroup(string sellerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"seller-{sellerId}");
    }
}