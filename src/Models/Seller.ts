import mongoose, { Model, Schema } from "mongoose";
export interface Iseller extends mongoose.Document {
  account: string;
  location: string;
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  documentType: string;
  documentId: string;
  documentCountry: string;
  gender: string;
  dob: Date;
  package: string;
  // country : string,
  file: string;
  isVerified: boolean;
  isPausedPayout: boolean;
  isActive: boolean;
  storeId: mongoose.Types.ObjectId;
  endDate: Date;
  subId: string;
  followers: [string];
  deleted: boolean;
  accId: string | null;
  paypal: string | null;
}

interface IsellerFun extends Model<Iseller> {
  findSellerById: (_id: mongoose.Types.ObjectId) => Iseller;
}
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
    isPausedPayout: {
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
    paypal: {
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
const Seller = mongoose.model<Iseller, IsellerFun>("seller", sellerSchema);
export default Seller;
