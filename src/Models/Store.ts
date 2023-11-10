import * as mongoose from "mongoose";
import Category from "./Category";
import SubCategory from "./SubCategory";
import category from "./Category";
import { Model } from "mongoose";

type subcategory = {
  title: string;
};

type category = {
  category: string;
};

type IType = {
  express: number;
  standard: number;
};
export interface IStore extends mongoose.Document {
  name: string;
  balance: number;
  summary: string;
  location: string;
  account: string;
  logo: string;
  views: number;
  currency: string;
  owner: mongoose.Types.ObjectId;
  _id: mongoose.Types.ObjectId;
  categories: category[];
  expenses: number;
  listing: number;
  refund: string;
  isVerified: boolean;
  sales: number;
  reputation: number;
  sold: number;
  lastCheck: number;
  disabled: boolean;
  sellGlobal: boolean;
  domesticShipping: IType;
  disableChat: boolean;
  updatedAt: Date;
}
export interface IStoreFun extends Model<IStore> {
  findStore: () => IStore;
}
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
    sellGlobal: {
      type: Boolean,
      default: true,
    },
    disableChat: {
      type: Boolean,
      default: false,
    },
    domesticShipping: {
      express: {
        type: Number,
        default: 0,
      },
      standard: {
        type: Number,
        default: 0,
      },
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

const Store = mongoose.model<IStore, IStoreFun>("Store", storeSchema);

export default Store;
