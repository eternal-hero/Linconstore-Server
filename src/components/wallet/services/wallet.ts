import Seller from "../../../Models/Seller";
import { NotFoundError } from "../../../libs/helpers/errors";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import {
  ICreateAvailablePayout,
  ICreateWalletEntry,
  IWallet,
  IWalletEntry,
  IWalletEntryStatus,
} from "../interface/wallet";
import { Wallet, WalletEntry } from "../models";

export class WalletService {
  static async getBalance(ownerId: string): Promise<IWallet> {
    const wallet: IWallet | null = await Wallet.findOne({ ownerId });

    if (!wallet) {
      const newWallet = new Wallet({
        ownerId,
      });

      await newWallet.save();

      return newWallet;
    }

    return wallet;
  }

  static async createWalletPayout(
    payload: ICreateWalletEntry
  ): Promise<IWalletEntry> {
    const { orderId, amount, ownerId } = payload;

    const wallet = await this.getBalance(ownerId);

    const seller = await Seller.findOne({storeId: ownerId});

    const fee = seller?.package === "Premium" ? 0.05 : 0.1;

    const amountDue = amount - amount * fee;

    const walletEntry = new WalletEntry({
      orderId: new ObjectId(orderId as unknown as mongoose.Types.ObjectId),
      amount,
      amountDue,
      ownerId: new ObjectId(ownerId as unknown as mongoose.Types.ObjectId),
      walletId: wallet.id,
    });

    wallet.pendingPayout = (wallet.pendingPayout ?? 0) + Number(amountDue);

    await walletEntry.save();
    await wallet.save();

    return walletEntry;
  }

  static async updateAvailablePayout(
    payload: ICreateAvailablePayout
  ): Promise<IWallet> {
    const walletEntry = await WalletEntry.findOne({ orderId: payload.orderId });

    if (!walletEntry) throw new NotFoundError("Order not found");

    const wallet = await this.getBalance(walletEntry.ownerId);

    wallet.pendingPayout = wallet.pendingPayout - walletEntry.amountDue;
    wallet.balance = wallet.balance + walletEntry.amountDue;

    walletEntry.status = IWalletEntryStatus.PROCESSED;

    await wallet.save();
    await walletEntry.save();

    return wallet;
  }
}
