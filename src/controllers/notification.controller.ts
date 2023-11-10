import { Request, Response } from "express";
import { services } from "../services";

const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const notifications = await services.notificationService.readNotifications(userId)
        res.status(200).json(notifications);
    } catch (e) {
        res.status(500).send('Internal Server Error')
    }
}

const markNotificationsRead = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = req.user
        const user_id:string = user.role === 'seller' ? `seller-${user.sellerId}` : user.role === 'user' ? `user-${user._id}` : ''
        const notifications = await services.notificationService.markNotificationsRead(id,user_id)
        res.status(200).json(notifications);
    } catch (e) {
        res.status(500).send('Internal Server Error')
    }
}

export const notificationController = {
    getNotifications,
    markNotificationsRead
}