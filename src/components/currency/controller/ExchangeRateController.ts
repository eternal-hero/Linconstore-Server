import { Request, Response } from "express";
import { ExchangeRateService } from "../services";
import { SuccessResponse } from "../../../libs/helpers/responses";

export class RatesController {
  static async getRates(req: Request, res: Response): Promise<Response> {
    const outcome = await ExchangeRateService.getRates();
    return new SuccessResponse(200, outcome).send(res);
  }
}
