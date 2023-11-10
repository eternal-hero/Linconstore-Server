import mongoose, {Schema} from "mongoose";
import { USER_ROLE, NOTIFICATION_TARGET } from "../socket/types";
export  interface INotification extends mongoose.Document{
    from: String,
    to: String,
    senderRole: USER_ROLE,
    title: string,
    content: string,
    language: string,
    region: string,
    isRead: boolean,
    sellerId?: string
}

const notificationSchema = new mongoose.Schema({
    from: {
        type: String,
        required: true,
    },
    to: {
        type: String,
        default: null
    },
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    sellerId: {
        type: String,
        default: null,
    },
    language: {
        type: String,
        default: null,
    },
    region: {
        type: String,
        default: null,
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const Notification =  mongoose.model<INotification>('notifications', notificationSchema)

export default Notification;