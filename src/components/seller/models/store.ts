import mongoose from "mongoose";
import { IStore } from "../interface/store";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: true,
      minLength: 4,
    },
    summary: {
      type: String,
      trim: true,
      required: true,
      minLength: 10,
    },
    location: {
      type: String,
      trim: true,
      required: true,
    },
    lastCheck: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    expenses: {
      type: Number,
      default: 0,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      required: true,
      unique: true,
      ref: "Seller",
    },

    sales: {
      type: Number,
      default: 0,
    },
    // categories : [{
    //     type : String,
    //     required: true
    // }],
    balance: {
      type: Number,
      default: 0,
    },
    refund: {
      trim: true,
      type: String,
      ref: "Refund",
    },
    listing: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
    },
    account: {
      type: String,
      required: true,
      trim: true,
    },
    reputation: {
      type: Number,
      default: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// export const Store = mongoose.model<IStore>("Store", storeSchema);
