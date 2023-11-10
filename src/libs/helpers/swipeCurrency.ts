import axios from "axios";
import { logger } from "./logger";
const key = process.env.STRIPE;
export const StripeRates = async (currency: string) => {
  try {
    const response = await axios.get(
      `https://api.striperates.com/rates/${currency}`,
      {
        headers: {
          "x-api-key": String(key),
        },
      }
    );
    const data = response.data;
    return data.data[0].rates.usd;
  } catch (error) {
    logger.error(`Strip rate endpoint error ${JSON.stringify(error)}`);
  }
};
