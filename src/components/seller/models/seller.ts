import mongoose from "mongoose";
import { ISeller } from "../interface";

const sellerSchema = new mongoose.Schema(
  {
    account: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
    },
    documentType: {
      type: String,
      required: true,
    },
    documentId: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
    },
    // country: {
    //     type : String
    // },
    package: {
      type: String,
    },
    documentCountry: {
      type: String,
    },
    file: {
      type: String,
      required: true,
    },
    storeId: {
      type: mongoose.Types.ObjectId,
      ref: "Store",
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    accId: {
      type: String,
      default: null,
    },
    websiteUrl: {
      type: String,
    },
    followers: [String],
    subId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
sellerSchema.virtual("store", {
  ref: "Store",
  localField: "storeId",
  foreignField: "_id",
});
export const Seller = mongoose.model<ISeller>("seller", sellerSchema);
