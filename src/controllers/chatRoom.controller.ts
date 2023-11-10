import { Request, Response } from "express";
import { services } from "../services";

const createChatRoom = async (req: Request, res: Response) => {
    try {
        const result = await services.chatRoomService.createNewChatRoom(req.body);
        if (result.status === 'new') {
            res.status(201).json({ room: result.room })
        } else {
            res.status(200).json({ room: result.room })
        }
    } catch (e) {
        res.status(500).send('Internal Server Error')
    }
}

const getChatRoom = async (req: Request, res: Response) => {
    try {
        const {buyerId, sellerId, isAdminLoggedIn} = req.query
        const result = await services.chatRoomService.getChatRoom(buyerId, sellerId, isAdminLoggedIn);
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}

const getBuyerChatRoom = async (req: Request, res: Response) => {
    try {
        const {buyerId} = req.query
        const result = await services.chatRoomService.getBuyerChatRoom(buyerId);
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}

const getBuyerChatRoomForAdmin = async (req: Request, res: Response) => {
    try {
        const {roomName} = req.query
        const result = await services.chatRoomService.getBuyerChatRoomForAdmin(roomName);
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}

const getAdminChatRoom = async (req: Request, res: Response) => {
    try {
        const result = await services.chatRoomService.getAdminChatRoom();
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}

const getSellerChatRoom = async (req: Request, res: Response) => {
    try {
        const {sellerId} = req.query
        const result = await services.chatRoomService.getSellerChatRoom(sellerId);
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}

const deleteChatRoom = async (req: Request, res: Response) => {
    try {
        const {roomId,sellerId,buyerId,role,adminId} = req.query
        const user_id = role == 'user' ? buyerId : role == 'admin' ? adminId : sellerId
        const result = await services.chatRoomService.deleteChatRoom(roomId,user_id,role);
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}

const deleteAdminChatRoom = async (req: Request, res: Response) => {
    try {
        const {roomId,role} = req.query
        const result = await services.chatRoomService.deleteAdminChatRoom(roomId,role);
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}

const closeChatRoom = async (req: Request, res: Response) => {
    try {
        const { roomName } = req.body;
        const result = await services.chatRoomService.closeChatRoom(roomName)
        res.status(result.status).send(result.chatRoom)
    } catch (e) {
        res.status(500).send('Internal Server Error')
    }
}

export const chatRoomController = {
    createChatRoom,
    getChatRoom,
    closeChatRoom,
    getBuyerChatRoom,
    deleteChatRoom,
    getSellerChatRoom,
    getBuyerChatRoomForAdmin,
    getAdminChatRoom,
    deleteAdminChatRoom
}