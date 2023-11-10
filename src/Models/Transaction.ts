import mongoose from "mongoose";
import validator from "validator";

export interface ITransaction extends mongoose.Document {
    _id: mongoose.Types.ObjectId;
    type: string;
    account: string;
    method: string;
    amount: number;
    currency: string;
    storeId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const transactionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            require: true,
            trim: true
        },
        account: {
            type: String,
            trim: true,
            required: true,
            lowercase: true,
            validate(value: string) {
                if (!validator.isEmail(value)) {
                    throw new Error("Email is invalid");
                }
            },
        },
        method: {
            type: String,
            require: true,
            trim: true
        },
        amount: {
            type: Number,
            require: true
        },
        storeId: {
            type: String,
            require: true
        },
        status: {
            type: String,
            require: true,
            trim: true
        }

    },
    {
        timestamps: true,
    }
)


const Transaction = mongoose.model<ITransaction>("transaction", transactionSchema);

export default Transaction;
