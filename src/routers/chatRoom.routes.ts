import { Router } from "express";
import { controller } from "../controllers";
import { auth } from "../Middleware/auth";

const router = Router();

router.post('/chatRoom', controller.chatRoomController.createChatRoom)
router.get('/chatRoom/', controller.chatRoomController.getChatRoom)
router.get('/buyerChatRoom', controller.chatRoomController.getBuyerChatRoom)
router.get('/sellerChatRoom', controller.chatRoomController.getSellerChatRoom)
router.patch('/chatRoom/status', controller.chatRoomController.closeChatRoom)
router.delete('/deleteChatRoom',auth, controller.chatRoomController.deleteChatRoom)
router.get('/buyerChatRoomForAdmin',auth, controller.chatRoomController.getBuyerChatRoomForAdmin)
router.get('/adminChatRoom', controller.chatRoomController.getAdminChatRoom)
router.delete('/deleteAdminChatRoom', controller.chatRoomController.deleteAdminChatRoom)



export default router