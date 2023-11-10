import * as Mongoose from "mongoose";
import validator from "validator";
import mongoose, { Model, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

type Itoken = {
  token: string;
};
export interface Iuser extends mongoose.Document {
  email: string;
  _id: mongoose.Types.ObjectId;
  password: string;
  firstName: string;
  lastName: string;
  tokens: Itoken[];
  role: string;
  otp: number;
  phone: string;
  customer_id: string;
  isVerified: boolean;
  plan: string;
  generateAuthToken: () => Promise<string>;
  endDate: Date;
  subId: string;
  payId: string | null;
  shipping: string;
  orders: number;
  language: string;
  currency: string;
  accId: string;
  isClosed: boolean;
  following: string[];
  sellerId: mongoose.Types.ObjectId;
}

// findByCredential : (email : string, password : string) =>  Iuser

interface IUserModel extends Model<Iuser> {
  findByCredentials: (email: string, password: string) => Iuser;
}
const userSchema: Schema = new Mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      trim: true,
      required: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Must be at least two characters"],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: [2, "Must be at least two characters"],
    },
    following: [String],
    password: {
      type: String,
      required: true,
      trim: true,
      validate(value: string) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password must not contain password");
        }
      },
      minLength: 6,
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    role: {
      type: String,
      trim: true,
      default: "user",
      lowercase: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
    },
    country: {
      type: String,
    },
    otp: {
      type: Number,
      required: true,
    },
    customer_id: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      trim: true,
      minLength: 3,
      maxLength: 10,
    },
    endDate: {
      type: Date,
    },
    subId: {
      type: String,
      trim: true,
    },
    accId: {
      type: String,
      trim: true,
    },
    orders: {
      type: Number,
      default: 0,
    },
    language: {
      type: String,
      default: "en",
    },
    currency: {
      type: String,
      default: "usd",
    },
    payId: {
      type: String,
    },
    shipping: {
      type: String,
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
    sellerId: {
      type: mongoose.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const user = this;

  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.tokens;
  delete userObj.otp;
  return userObj;
};
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  try {
    const token = await jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET
    );
    user.tokens = user.tokens.concat({ token });
    await user.save();
    return token;
  } catch (e) {
    return null;
  }
};
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};
userSchema.pre("save", async function (next, opts) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

const User = mongoose.model<Iuser, IUserModel>("user", userSchema);

export default User;
