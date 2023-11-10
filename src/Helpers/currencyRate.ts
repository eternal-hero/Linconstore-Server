import axios from "axios";
import { exchangeCurrency } from "../components/currency/constant";
import { Rates } from "../components/currency/models";
import { IExchangeRate } from "../components/currency/interface";
export const key = process.env.STRIPE || "";

export interface IRate {
  Pounds: number;
  EUR: number;
  USD: number;
  AUD: number;
  BGN: number;
  CAD: number;
  HRK: number;
  CZK: number;
  DKK: number;
  HUF: number;
  MXN: number;
  NZD: number;
  NOK: number;
  PLN: number;
  SEK: number;
  CHF: number;
}
export const handleRateChange = async (): Promise<IRate> => {
  const pounds: number = await calculateRate("gbp");
  const euro: number = await calculateRate("eur");
  const aud: number = await calculateRate("aud");
  const bgn: number = await calculateRate("bgn");
  const cad: number = await calculateRate("cad");
  const hrk: number = await calculateRate("hrk");
  const czk: number = await calculateRate("czk");
  const dkk: number = await calculateRate("dkk");
  const huf: number = await calculateRate("huf");
  const mxn: number = await calculateRate("mxn");
  const nzd: number = await calculateRate("nzd");
  const nok: number = await calculateRate("nok");
  const pln: number = await calculateRate("pln");
  const sek: number = await calculateRate("sek");
  const chf: number = await calculateRate("chf");

  return {
    Pounds: pounds,
    EUR: euro,
    USD: 1,
    AUD: aud,
    BGN: bgn,
    CAD: cad,
    HRK: hrk,
    CZK: czk,
    DKK: dkk,
    HUF: huf,
    MXN: mxn,
    NZD: nzd,
    NOK: nok,
    PLN: pln,
    SEK: sek,
    CHF: chf
  };
};

export const calculateRate = async (label: string): Promise<number> => {
  const value = (exchangeCurrency.find(c => c.label === label))?.value ?? "USD";

  try {
    const data: IExchangeRate | null = await Rates.findOne({
      name: value,
    });

    if (data) {
      return Number(data.rate);
    } else {
      throw new Error("Exchange rate data not found");
    }
  } catch (e) {
    console.log(e);
    throw new Error("Error fetching exchange rate");
  }
};

