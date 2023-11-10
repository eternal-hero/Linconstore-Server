import Notification, { INotification } from "../Models/Notication"

const readNotifications = async (userId: string) => {
    const notifications = await Notification.find({ from: userId }).sort({ createdAt: "desc" }).exec();
    return notifications
}

const markNotificationsRead = async (id: string, user_id: string) => {
    let result = null
    if (id === 'all') {
        await Notification.updateMany({
            from: user_id
        }, { $set: { isRead: true } }).exec();
        result = Notification.find({
            from: user_id
        }).exec();
    } else {
        await Notification.updateOne({
            _id: id
        }, { $set: { isRead: true } }).exec();
        result = await Notification.findOne({
            _id: id
        }).exec();
    }
    return result
}

export const notificationService = {
    readNotifications,
    markNotificationsRead
}