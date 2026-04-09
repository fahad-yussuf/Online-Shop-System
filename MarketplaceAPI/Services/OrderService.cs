using MarketplaceAPI.Data;
using MarketplaceAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MarketplaceAPI.Services;

public class InvalidOrderStateException : Exception
{
    public InvalidOrderStateException(string message) : base(message) { }
}

public class OrderService
{
    private readonly AppDbContext _db;
    private readonly CartService _cart;
    private readonly StockNotificationService _notifications;

    public OrderService(AppDbContext db, CartService cart, StockNotificationService notifications)
    {
        _db = db;
        _cart = cart;
        _notifications = notifications;
    }

    public async Task<Order> PlaceOrderAsync(int buyerId)
    {
        var cart = await _cart.GetCartAsync(buyerId);
        if (!cart.Items.Any())
            throw new InvalidOrderStateException("Cart is empty");

        await using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var order = new Order { BuyerId = buyerId };
            var stockUpdates = new List<(string ProductId, string ProductName, int NewQuantity)>();

            foreach (var item in cart.Items)
            {
                var inventory = await _db.Inventories
                    .FirstOrDefaultAsync(i => i.ProductId == item.ProductId);

                if (inventory == null)
                    throw new InvalidOrderStateException($"No inventory found for {item.ProductName}");

                if (inventory.Quantity < item.Quantity)
                    throw new InvalidOrderStateException($"Insufficient stock for {item.ProductName}");

                inventory.Quantity -= item.Quantity;
                stockUpdates.Add((item.ProductId, item.ProductName, inventory.Quantity));

                order.Items.Add(new OrderItem
                {
                    ProductId = item.ProductId,
                    ProductName = item.ProductName,
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity
                });
            }

            _db.Orders.Add(order);

            try
            {
                await _db.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new InvalidOrderStateException("Stock was modified by another request. Please try again.");
            }

            await transaction.CommitAsync();
            await _cart.ClearAsync(buyerId);

            // Fire stock notifications AFTER transaction commits
            foreach (var (productId, productName, newQuantity) in stockUpdates)
            {
                await _notifications.NotifyStockUpdated(productId, productName, newQuantity);
            }

            // Notify each seller whose products were ordered
            var sellerIds = await _db.Inventories
                .Where(i => order.Items.Select(oi => oi.ProductId).Contains(i.ProductId))
                .Select(i => new { i.SellerId, i.ProductId })
                .ToListAsync();

            var sellerGroups = sellerIds.GroupBy(x => x.SellerId);
            foreach (var group in sellerGroups)
            {
                await _notifications.NotifyNewOrder(
                    order.Id,
                    group.Key,
                    group.Select(x => x.ProductId).ToList());
            }

            return order;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<Order> AdvanceStatusAsync(int orderId, OrderStatus newStatus, int userId, bool isSeller)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
            throw new InvalidOrderStateException("Order not found");

        ValidateTransition(order.Status, newStatus, isSeller);

        if (newStatus == OrderStatus.Cancelled)
        {
            foreach (var item in order.Items)
            {
                var inventory = await _db.Inventories
                    .FirstOrDefaultAsync(i => i.ProductId == item.ProductId);

                if (inventory != null)
                {
                    inventory.Quantity += item.Quantity;
                    await _notifications.NotifyStockUpdated(
                        item.ProductId, item.ProductName, inventory.Quantity);
                }
            }
        }

        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return order;
    }

    private static void ValidateTransition(OrderStatus current, OrderStatus next, bool isSeller)
    {
        var allowed = (current, next, isSeller) switch
        {
            (OrderStatus.Pending, OrderStatus.Cancelled, false) => true,
            (OrderStatus.Pending, OrderStatus.Paid, true) => true,
            (OrderStatus.Paid, OrderStatus.Fulfilled, true) => true,
            (OrderStatus.Paid, OrderStatus.Cancelled, true) => true,
            _ => false
        };

        if (!allowed)
            throw new InvalidOrderStateException(
                $"Cannot transition order from {current} to {next}");
    }

    public async Task<List<Order>> GetBuyerOrdersAsync(int buyerId) =>
        await _db.Orders
            .Include(o => o.Items)
            .Where(o => o.BuyerId == buyerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

    public async Task<List<Order>> GetSellerOrdersAsync(int sellerId) =>
        await _db.Orders
            .Include(o => o.Items)
            .Where(o => o.Items.Any(i =>
                _db.Inventories.Any(inv =>
                    inv.ProductId == i.ProductId && inv.SellerId == sellerId)))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
}