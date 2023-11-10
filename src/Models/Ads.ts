import mongoose from "mongoose";
export interface Iads extends mongoose.Document {
    productId: mongoose.Schema.Types.ObjectId;
    owner: mongoose.Schema.Types.ObjectId;
    title: string;
    createdAt: Date;
    updatedAt: Date;
}

const adsSchema = new mongoose.Schema(
    {
        productId: {
            ref: 'Product',
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true
        },
        title: {
            type: String,
            required: true
        },
        owner: {
            ref: 'Store',
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },
    {
        timestamps: true,
    }
)
const Ads = mongoose.model<Iads>('ads', adsSchema);

export default Ads;