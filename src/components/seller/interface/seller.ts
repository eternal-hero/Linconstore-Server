import mongoose from "mongoose";

export interface ISeller extends mongoose.Document {
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
  isActive: boolean;
  storeId: mongoose.Types.ObjectId;
  endDate: Date;
  subId: string;
  followers: [string];
  deleted: boolean;
  accId: string | null;
}

export interface IFilterSeller {
  _id?: mongoose.Types.ObjectId;
  owner?: mongoose.Types.ObjectId;
}
