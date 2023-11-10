import { Router } from "express";
import { CatchErrorHandler } from "../../../libs/helpers/errors";
import {
  activeSeller,
  adminAuth,
  auth,
  sellerAuth,
} from "../../../Middleware/auth";
import { StoreController } from "../controller";

const router = Router();

router.get("/store", auth, CatchErrorHandler(StoreController.getStore));

router.put("/store", auth, CatchErrorHandler(StoreController.updateStore));

export default router;
