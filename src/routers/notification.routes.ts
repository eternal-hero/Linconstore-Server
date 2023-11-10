import { Router } from "express";
import { controller } from "../controllers";
import { auth } from "../Middleware/auth";

const router = Router();

router.get('/api/notification/:userId',auth, controller.notificationController.getNotifications);

router.get('/api/notification/markRead/:id',auth, controller.notificationController.markNotificationsRead);

export default router