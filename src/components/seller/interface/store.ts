import mongoose from "mongoose";

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
  categories: Array<category>;
  expenses: number;
  listing: number;
  refund: string;
  isVerified: boolean;
  sales: number;
  reputation: number;
  sold: number;
  lastCheck: number;
  disabled: boolean;
  updatedAt: Date;
  sellGlobal: boolean;
  domesticShipping: IType;
  disableChat: boolean;
}

export interface IFilterStore {
  _id?: string;
  owner?: mongoose.Types.ObjectId;
}

export interface IUpdateStore {
  sellGlobal: boolean;
  disableChat: boolean;
  domesticShipping: IType;
  userId: mongoose.Types.ObjectId;
}

export interface IId {
  id: mongoose.Types.ObjectId;
}
