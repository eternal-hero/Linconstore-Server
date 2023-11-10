import mongoose from "mongoose";

export interface IWallet extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId | string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  pendingPayout: number;
}

const walletSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Types.ObjectId,
      ref: "seller",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    pendingPayout: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model<IWallet>("wallet", walletSchema);
export default Wallet;
