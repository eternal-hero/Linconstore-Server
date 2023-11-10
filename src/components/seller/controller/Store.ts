import { Request, Response } from "express";
import { StoreServices } from "../services";
import { SuccessResponse } from "../../../libs/helpers/responses";

export class StoreController {
  static async getStore(req: Request, res: Response): Promise<Response> {
    const userId = req.user._id;
    const outcome = await StoreServices.getUserStore(userId);

    return new SuccessResponse(200, outcome).send(res);
  }

  static async updateStore(req: Request, res: Response): Promise<Response> {
    const outcome = await StoreServices.updateStore({
      userId: req.user._id,
      ...req.body,
    });

    return new SuccessResponse(201, outcome).send(res);
  }
}
