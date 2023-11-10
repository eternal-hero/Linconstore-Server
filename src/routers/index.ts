import { Router, Request, Response } from "express";
import { CatchErrorHandler } from "../libs/helpers/errors";
import { SuccessResponse } from "../libs/helpers/responses";
import SellerRouter from "../components/seller/routes";
import CurrencyRouter from "../components/currency/routes";

const router = Router();

router.get(
  "/",
  CatchErrorHandler((_: Request, res: Response) => {
    return new SuccessResponse(200, { user: "Welcome here" }).send(res);
  })
);

const apiPrefix = process.env.API_PREFIX;

router.use(`${apiPrefix}/seller`, SellerRouter);
router.use(`${apiPrefix}/exchange`, CurrencyRouter);

export default router;
