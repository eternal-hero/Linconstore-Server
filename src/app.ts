import express, { Express, Request, response, Response } from "express";
import userRouter from "./routers/user";
import { dbconnect } from "./db/connect";
import sellerRouter from "./routers/Seller";
import categoryRouter from "./routers/Category";
import productRouter from "./routers/product";
import notificationRouter from "./routers/notification.routes";
import currencyRouter from './components/currency/routes/index';
import adminRouter from "./routers/admin";
import chatRoomRouter from "./routers/chatRoom.routes";
import reportRouter from "./routers/report.routes";
import { ExchangeRateService } from "./components/currency/services";
import routes from "./routers";
import * as http from "http";
import cors from "cors";
import cron from "node-cron";
import {
  deleteInvalidStores,
  handleSetSellerRep,
  updateActivity,
  updateCart,
  updateHotdeals,
  updateOrders,
  updateProductStatus,
  updateShipping,
  updateStoreActivity,
} from "./Helpers/helpers";
import Stripe from "stripe";
import { initializeSocket } from "./socket";
const app: Express = express();
export const stripe: Stripe = new Stripe(process.env.SECRETKEY as string, {
  apiVersion: "2022-08-01",
});

import * as treblle from "treblle";
const { createProxyMiddleware } = require('http-proxy-middleware');
import { PostHog } from "posthog-node";
const client = new PostHog("phc_g0aaulGWsWuWDEYoUJbrtP2zOPs6GYYwQRblImjrQja", {
  host: "https://eu.posthog.com",
});

client.capture({
  distinctId: "test-id",
  event: "test-event",
});
// Send queued events immediately. Use for example in a serverless environment
// where the program may terminate before everything is sent
client.flush();

// Set up CORS middleware for multiple origins
app.use(cors({
  origin: ["https://linconstore.com", "https://linconstore.cloud", "http://localhost:3000",  "http://localhost:3001",],
}));
const server = http.createServer(app);
dbconnect;

initializeSocket(server);

// Define a common CORS header for all routes
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
// Schedule cron jobs for periodic tasks
cron.schedule("*/1 * * * *", () => {
  updateShipping();
  updateProductStatus();
  updateOrders();
  deleteInvalidStores();
});

cron.schedule("*/10 * * * *", () => {
  updateHotdeals();
});

cron.schedule("*/5 * * * *", () => {
  updateStoreActivity();
});

cron.schedule("0 8 * * *", () => {
  ExchangeRateService.generateExchangeRate();
});

cron.schedule("0 18 * * *", () => {
  ExchangeRateService.generateExchangeRate();
});

cron.schedule("*/10 * * * *", async () => {
  await updateCart();
});

cron.schedule("0 0 0 * * *", () => {
  updateShipping();
  updateActivity();
  handleSetSellerRep();
});
const port = process.env.PORT;

//webhooks event for receiving stripe subscription

app.post(
  "/webhooks",
  express.raw({ type: "application/json" }),
  (req: Request, res: Response) => {
    // @ts-ignore
    const sig: string | string[] | Buffer = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.endpointSecret as string
      );
    } catch (err: any) {
      response.status(400).send(`webhook error : ${err.message}`);
      return;
    }
    //handling the event
    switch (event.type) {
      case "customer.subscription.created":
        const subscription = event.data.object;
        break;
      case "customer.subscription.deleted":
        const subscription1 = event.data.object;
        break;
      case "customer.subscription.updated":
        const subscription2 = event.data.object;
        break;
      default:
        console.log(`unhandled event type ${event.type}`);
    }
    response.status(200).send();
  }
);

app.use(express.json()); //allows us to parse incoming request to json

app.use(routes);
app.use(userRouter);
app.use(adminRouter);
app.use(categoryRouter);
app.use(sellerRouter);
app.use(productRouter);
app.use(notificationRouter);
app.use(chatRoomRouter);
app.use(reportRouter);
app.use(currencyRouter);

treblle.useTreblle(app, {
  apiKey: process.env.TREBLLE_APIKEY,
  projectId: process.env.TREBLLE_PROJECTID,
});

// Create a proxy middleware
const proxyMiddlewareUser = createProxyMiddleware({
  target: 'https://linconstore.com', 
  changeOrigin: true, 
});

const proxyMiddlewareAdmin = createProxyMiddleware({
  target: 'https://linconstore.cloud/', 
  changeOrigin: true, 
});

const proxyMiddlewareServer = createProxyMiddleware({
  target: 'https://server.linconstore.com', // Replace with your target URL
  changeOrigin: true, // Set this to true if you want to change the origin of the request
});

// Add the proxy middleware to your Express app
app.use('/', proxyMiddlewareUser); 
app.use('/', proxyMiddlewareAdmin);
app.use('/', proxyMiddlewareServer);

server.listen(port, () => {
  console.log("running on port " + " " + port);
});
