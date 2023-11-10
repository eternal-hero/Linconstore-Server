import mongoose from "mongoose";
import { IExchangeRate } from "../interface";

const exchangeRateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    symbol: {
      type: String,
    },
    rate: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Rates = mongoose.model<IExchangeRate>(
  "exchange-rate",
  exchangeRateSchema
);
