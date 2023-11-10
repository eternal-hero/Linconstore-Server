import { Router } from "express";
import { Request, Response } from "express";
import { Rates } from "../models";
import { IExchangeRate } from "../interface";
import { CatchErrorHandler } from "../../../libs/helpers/errors";
import { RatesController } from "../controller";

const router = Router();

router.get("/rates", CatchErrorHandler(RatesController.getRates));
router.patch(
    "/rate/:name",
    async (req: Request, res: Response) => {
        const { name } = req.params;
        try {
            const rate: IExchangeRate | null = await Rates.findOne({
                name: name,
            });
            return res.status(200).send(rate);
        } catch (e) {
            console.log(e);
            res.status(500).send(e);
        }
    }
);
export default router;
