import mongoose from "mongoose";

export interface IActivity extends mongoose.Document {
    productId: mongoose.Schema.Types.ObjectId,
    sellerId: mongoose.Schema.Types.ObjectId,
    bill: number,
    name: string,
    type: string
}

const activitySchema = new  mongoose.Schema({
            productId : {
                ref: 'Product',
                type: mongoose.Schema.Types.ObjectId,
            },
            name: {
                type: String,
                required : false,
                trim: true
            },
            sellerId : {
                ref : 'Seller',
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            type: {
              default : 'credit',
              type: String,
              trim: true
            },
            bill : {
                type: Number,
                default:0
            }
},  {
    timestamps: true
    }
    )
const Activity = mongoose.model<IActivity>('activity', activitySchema);
export default Activity;