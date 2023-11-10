import mongoose from "mongoose";

export interface IAddress extends mongoose.Document {
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  country: string;
  zipCode: string;
  state: string;
  city: string;
  type: string;
  userId: mongoose.Types.ObjectId;
  default: boolean;
}
const addressSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    address: {
      required: true,
      type: String,
      minLength: 10,
      trim: true,
    },
    phoneNumber: {
      required: true,
      type: Number,
    },
    country: {
      type: String,
    },
    zipCode: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    userId: {
      required: true,
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    default: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "shipping",
    },
  },
  {
    timestamps: true,
  }
);

const Address = mongoose.model<IAddress>("address", addressSchema);

export default Address;
