import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import { IWalletEntry } from "../interface/wallet";
const objectId = mongoose.Types.ObjectId;

const walletEntrySchema = new Schema(
  {
    orderId: {
      type: objectId,
      ref: "Order",
    },
    walletId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    amountDue: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "PAYOUT"],
      default: "PENDING",
    },
    dateProcessed: {
      type: Date,
    },
    ownerId: {
      type: objectId,
      ref: "Store",
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

export const WalletEntry = model<IWalletEntry>(
  "walletEntry",
  walletEntrySchema
);
