import mongoose from "mongoose";
import { CHATROOM_STATUS, CHAT_TYPE, USER_ROLE } from "../socket/types";

export interface IChatRoom extends mongoose.Document {
    roomName: String,
    type: CHAT_TYPE,
    isAdminJoined: boolean,
    status: CHATROOM_STATUS,
    sellerId: mongoose.Types.ObjectId | null,
    buyerId: mongoose.Types.ObjectId,
    productId: mongoose.Types.ObjectId | null,
}
const chatRoomSchema = new mongoose.Schema(
    {
        roomName: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        isAdminJoined: {
            type: Boolean,
            required: true,
            default: false,
        },
        status: {
            type: String,
            required: true,
            default: false
        },
        sellerId: {
            type: mongoose.Types.ObjectId,
            default: null,
        },
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user', // Reference to the User schema
            required: true,
        },
        productId: {
            type: mongoose.Types.ObjectId,
            ref: 'product',
            default: null,
        },
        deletedBySellerId: {
            type: String,
            default:null
        },
        deletedByBuyerId: {
            type: String,
            default:null
        },
        deletedByRole: {
            type: String,
            default:null
        }
    },  
    {
        timestamps: true
    }
)

const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema)
export default ChatRoom;