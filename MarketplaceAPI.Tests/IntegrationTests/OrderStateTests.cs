using MarketplaceAPI.Models;
using MarketplaceAPI.Services;
using Xunit;

namespace MarketplaceAPI.Tests.IntegrationTests;

public class OrderStateTests
{
    [Fact]
    public void ValidTransition_PendingToPaid_Seller_Succeeds()
    {
        // This tests the state machine logic directly
        // Valid: seller marks pending order as paid
        var exception = Record.Exception(() =>
            InvokeValidateTransition(OrderStatus.Pending, OrderStatus.Paid, isSeller: true));
        Assert.Null(exception);
    }

    [Fact]
    public void InvalidTransition_FulfilledToCancelled_Throws()
    {
        // Invalid: cannot cancel a fulfilled order
        Assert.Throws<InvalidOrderStateException>(() =>
            InvokeValidateTransition(OrderStatus.Fulfilled, OrderStatus.Cancelled, isSeller: true));
    }

    [Fact]
    public void InvalidTransition_BuyerMarkingPaid_Throws()
    {
        // Invalid: buyer cannot mark an order as paid
        Assert.Throws<InvalidOrderStateException>(() =>
            InvokeValidateTransition(OrderStatus.Pending, OrderStatus.Paid, isSeller: false));
    }

    [Fact]
    public void ValidTransition_BuyerCancelsPending_Succeeds()
    {
        // Valid: buyer can cancel their own pending order
        var exception = Record.Exception(() =>
            InvokeValidateTransition(OrderStatus.Pending, OrderStatus.Cancelled, isSeller: false));
        Assert.Null(exception);
    }

    // We expose the private method for testing via reflection
    // In a real project you'd make ValidateTransition internal with InternalsVisibleTo
    private static void InvokeValidateTransition(OrderStatus current, OrderStatus next, bool isSeller)
    {
        var method = typeof(OrderService).GetMethod(
            "ValidateTransition",
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        try
        {
            method!.Invoke(null, new object[] { current, next, isSeller });
        }
        catch (System.Reflection.TargetInvocationException ex)
        {
            throw ex.InnerException!;
        }
    }
}