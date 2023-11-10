import mongoose from "mongoose";

export interface IWallet extends mongoose.Document {
  pendingPayout: number;
  balance: number;
  ownerId: string;
  id: string;
}

export interface IWalletEntry {
  orderId?: string;
  amount: number;
  amountDue: number;
  status: IWalletEntryStatus;
  dateProcessed: Date;
  walletId: string;
  ownerId: string;
  id: string;
}

export enum IWalletEntryStatus {
  PENDING = "PENDING",
  PROCESSED = "PROCESSED",
  PAYOUT = "PAYOUT",
}

export interface ICreateWalletEntry {
  orderId: string;
  amount: number;
  ownerId: string;
}

export interface ICreateAvailablePayout {
  orderId: string;
}
