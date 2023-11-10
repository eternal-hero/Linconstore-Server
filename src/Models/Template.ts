import mongoose from "mongoose";
import bcrypt from "bcrypt";

const objectId = mongoose.Types.ObjectId;
type TVariant = {
  option: string;
  variant: string;
  price: number;
  stock: number;
};
type TProduct = {
  price: number;
  country: string;
};
type IType = {
  express: TProduct;
  standard: TProduct;
};
type IContinent = {
  africa: number;
  europe: number;
  antarctica: number;
  asia: number;
  northAmerica: number;
  southAmerica: number;
  oceania: number;
};

export interface ITemplate extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  condition: string;
  template_title: string;
  category: mongoose.Types.ObjectId;
  subcategory: string;
  price: number;
  quantity: number;
  tags: string[];
  policy: string;
  instruction: string;
  shippingDetail: string;
  active: boolean;
  currency: string;
  shipping: IType[];
  continents: IContinent[];
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new mongoose.Schema(
  {
    owner: {
      type: objectId,
      required: [true, "This is required"],
      ref: "Store",
    },
    title: {
      type: String,
      required: true,
      minLength: [4, "Must be a least 4 Characters"],
    },
    template_title: {
      type: String,
      required: true,
      minLength: [4, "Must be a least 4 Characters"],
    },
    category: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: "Category",
    },
    subcategory: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      default: "New",
      required: true,
    },
    currency: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    instruction: {
      type: String,
    },
    shippingDetail: {
      type: String,
    },
    shipping: [
      {
        express: {
          price: Number,
          country: String,
        },
        standard: {
          price: Number,
          country: String,
        },
      },
    ],
    continents: [
      {
        africa: Number,
        asia: Number,
        europe: Number,
        northAmerica: Number,
        southAmerica: Number,
        oceania: Number,
        antarctica: Number,
      },
    ],
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);
templateSchema.virtual("store", {
  ref: "Store",
  localField: "owner",
  foreignField: "_id",
});
templateSchema.virtual("categories", {
  ref: "Category",
  localField: "category",
  foreignField: "_id",
});

const Template = mongoose.model<ITemplate>("template", templateSchema);
export default Template;
