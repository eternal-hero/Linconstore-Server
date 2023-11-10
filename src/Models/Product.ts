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

export interface IProduct extends mongoose.Document {
  owner: mongoose.Types.ObjectId;
  photo: string[];
  title: string;
  condition: string;
  description: string;
  category: mongoose.Types.ObjectId;
  subcategory: string;
  price: number;
  quantity: number;
  weight: string;
  tags: string[];
  policy: string;
  instruction: string;
  shippingDetail: string;
  global: boolean;
  active: boolean;
  publish: boolean;
  discount: number;
  currency: string;
  view: number;
  hot: boolean;
  productUpdatedDate: Date;
  shipping: IType[];
  continents: IContinent[];
  variants: TVariant[];
  orders: number;
  ratingId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema(
  {
    owner: {
      type: objectId,
      required: [true, "This is required"],
      ref: "Store",
    },
    photo: [
      {
        type: String,
        required: true,
      },
    ],
    title: {
      type: String,
      required: true,
      minLength: [4, "Must be a least Six Characters"],
    },
    description: {
      type: String,
      required: true,
      minLength: [5, "Must be at least 5 characters "],
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
    discount: {
      type: Number,
    },
    currency: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
    },
    weight: {
      type: String,
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
    global: {
      type: Boolean,
      default: true,
    },
    productUpdatedDate: {
      type: Date,
    },
    hot: {
      type: Boolean,
    },
    active: {
      type: Boolean,
      default: true,
    },
    publish: {
      type: Boolean,
      default: true,
    },
    view: {
      type: Number,
    },
    variants: [
      {
        variant: {
          type: String,
        },
        option: {
          type: String,
        },
        stock: {
          type: Number,
        },
        price: {
          type: Number,
        },
      },
    ],
    ratingId: {
      type: mongoose.Types.ObjectId,
      ref: "Rating",
    },
    orders: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
productSchema.virtual("store", {
  ref: "Store",
  localField: "owner",
  foreignField: "_id",
});
productSchema.virtual("categories", {
  ref: "Category",
  localField: "category",
  foreignField: "_id",
});
// productSchema.pre('save', async function (next, opts){
//     const product = this;
//     if (product.isModified('price')){
//         product.price =   Number(product.price.toFixed(2))
//     }
//     next()
// })

const Product = mongoose.model<IProduct>("product", productSchema);
export default Product;
