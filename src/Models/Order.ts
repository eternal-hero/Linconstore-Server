import mongoose from "mongoose";
import { TVariant } from "./Cart";
const objectId = mongoose.Types.ObjectId;
export interface IOrder extends mongoose.Document {
  status: string;
  userId: typeof objectId;
  productId: typeof objectId;
  sellerId: mongoose.Types.ObjectId;
  trackingId: string;
  shippingProvider: string;
  price: number;
  name: string;
  quantity: number;
  createdAt: Date;
  amount: number;
  shippingCost: number;
  active: boolean;
  variants: TVariant[];
  address: string;
  shipping: string;
  activity: boolean;
  refund: boolean;
  updateShipping: Date;
  updated: boolean;
  sellerPackage: string;
}
const orderSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      trim: true,
      default: "placed",
    },
    userId: {
      required: true,
      ref: "User",
      type: objectId,
    },
    productId: {
      required: true,
      ref: "Product",
      type: objectId,
    },
    sellerId: {
      required: true,
      ref: "Seller",
      type: mongoose.Types.ObjectId,
    },
    price: {
      required: true,
      type: Number,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    refund: {
      type: Boolean,
    },
    shippingProvider: {
      type: String,
      trim: true,
    },
    trackingId: {
      type: String,
      trim: true,
    },
    variants: [
      {
        option: String,
        variant: String,
      },
    ],
    address: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity can not be less then 1"],
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    shipping: {
      type: String,
      default: "standard shipping",
    },
    activity: {
      type: Boolean,
      default: false,
    },
    updateShipping: {
      type: Date,
      default: Date.now(),
    },
    updated: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
    sellerPackage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model<IOrder>("order", orderSchema);

export default Order;
