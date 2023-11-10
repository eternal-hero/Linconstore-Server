import mongoose from "mongoose";

type IUser = {
    rating: number,
    userId: mongoose.Types.ObjectId,
    comment: string,
    name: string;
}
export interface IRating extends mongoose.Document{
    productId : mongoose.Types.ObjectId,
    ratings: IUser[],
    averageRating: number,
}
const ratingSchema = new mongoose.Schema({
    productId : {
        type: mongoose.Types.ObjectId,
        ref : 'Product'
    },
    ratings: [{
      rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5
      },
        userId : {
          required: true,
            type: mongoose.Types.ObjectId,
            ref: 'User'
        },
        comment: {
          type: String,
            trim: true
        },
        name: {
          type: String,
            required: true,
            trim: true
        }
    }],
    averageRating: {
        type: Number,
        min: 1,
        max: 5
    }
})

const Rating = mongoose.model<IRating>('Rating', ratingSchema)

export default Rating;