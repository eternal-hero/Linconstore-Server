import mongoose from "mongoose";
import { CHAT_TYPE, USER_ROLE } from "../socket/types";

export interface IMessage extends mongoose.Document {
    from: mongoose.Types.ObjectId,
    roomName: string,
    userName?: string,
    senderRole: USER_ROLE,
    type: CHAT_TYPE,
    content: string,
    isRead: boolean,
    image?:any
} 
const messageSchema = new mongoose.Schema(
    {
        from: {
            type: mongoose.Types.ObjectId,
            ref: 'User'
        },
        roomName: {
            type: String,
            required: true,
        },
        userName: {
            type: String,
            required: false,
        },
        senderRole: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true
        },
        isRead: {
            type: String,
            required: true,
            default: false,
        },
        image: {
            type:String,
            default:null
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

const Message = mongoose.model<IMessage>('messages', messageSchema)
export default Message;