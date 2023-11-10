import mongoose from "mongoose";
import { Schema, model } from "mongoose";
import { IWallet } from "../interface/wallet";
const objectId = mongoose.Types.ObjectId;

const walletSchema = new Schema(
  {
    pendingPayout: {
      type: Number,
      default: 0,
    },
    balance: {
      type: Number,
      default: 0,
    },
    ownerId: {
      type: objectId,
      required: true,
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

export const Wallet = model<IWallet>("wallet-account", walletSchema);
