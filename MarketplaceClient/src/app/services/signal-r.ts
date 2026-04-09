import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

export interface StockUpdate {
  productId: string;
  productName: string;
  newQuantity: number;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  quantity: number;
}

export interface NewOrderAlert {
  orderId: number;
  productIds: string[];
}

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private connection: signalR.HubConnection | null = null;

  // Observables that components subscribe to
  stockUpdated$ = new Subject<StockUpdate>();
  lowStockAlert$ = new Subject<LowStockAlert>();
  newOrder$ = new Subject<NewOrderAlert>();

  startConnection(): Promise<void> {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5165/hubs/stock', {
        withCredentials: true
      })
      .withAutomaticReconnect()
      .build();

    // Wire up event listeners before starting
    this.connection.on('StockUpdated', (data: StockUpdate) => {
      this.stockUpdated$.next(data);
    });

    this.connection.on('LowStockAlert', (data: LowStockAlert) => {
      this.lowStockAlert$.next(data);
    });

    this.connection.on('NewOrder', (data: NewOrderAlert) => {
      this.newOrder$.next(data);
    });

    return this.connection.start();
  }

  watchProduct(productId: string): Promise<void> {
    return this.connection!.invoke('WatchProduct', productId);
  }

  unwatchProduct(productId: string): Promise<void> {
    return this.connection!.invoke('UnwatchProduct', productId);
  }

  joinSellerGroup(sellerId: string): Promise<void> {
    return this.connection!.invoke('JoinSellerGroup', sellerId);
  }

  stopConnection(): Promise<void> {
    return this.connection?.stop() ?? Promise.resolve();
  }
}