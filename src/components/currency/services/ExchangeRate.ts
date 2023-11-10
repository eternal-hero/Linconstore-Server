import { logger } from "../../../libs/helpers";
import { StripeRates } from "../../../libs/helpers/swipeCurrency";
import { exchangeCurrency } from "../constant";
import { IExchangeRate } from "../interface";
import { Rates } from "../models";

export class ExchangeRateService {
  static async generateExchangeRate() {
    await Rates.deleteMany();
    const rates = [{ name: "USD", rate: 1, symbol: "$" }];
    for await (const rate of exchangeCurrency) {
      const response = await StripeRates(rate.label);

      rates.push({
        name: rate.value,
        symbol: rate.symbol,
        rate: Number(response.toFixed(4)),
      });
    }

    await Rates.create(rates);

    logger.info(`Rate created`);
  }

  static async getRates(): Promise<IExchangeRate[]> {
    logger.info(`Get rates endpoint was called now`);
    const rates = await Rates.find();
    return rates;
  }
}
