import User, { Iuser } from "../Models/User";
import mongoose from "mongoose";
import { generateOtp } from "./generateOtp";
import {
  orderDeliveredSuccessfully,
  OrderPlacedNotification,
  sellerOrderReceived,
  updateOrderShippedNotification,
  verifyEmail,
} from "./verifyUser";
import Order, { IOrder } from "../Models/Order";
import { getLastweek, getTimeDiff } from "./TimeDiff";
import { stripe } from "../app";
import Cart, { ICart, TProduct, TVariant } from "../Models/Cart";
import Product, { IProduct } from "../Models/Product";
import Seller, { Iseller } from "../Models/Seller";
import Admin, { IAdmin } from "../Models/Admin";
import baseUrl from "../baseurl/baseUrl";
import Store, { IStore } from "../Models/Store";
import Refund, { IRefund } from "../Models/Refund";
import Activity, { IActivity } from "../Models/Activity";
import Wish from "../Models/Wish";
import Stripe from "stripe";
import Shipping, { IShipping } from "../Models/Shipping";
import { ObjectId } from "mongodb";
import cron from "node-cron";
import Rating, { IRating } from "../Models/Rating";
import Review, { IReview } from "../Models/Review";
import Address, { IAddress } from "../Models/Address";
import rating from "../Models/Rating";
import { exchangeCurrency, countryCurrency } from "../components/currency/constant";
import Notification from "../Models/Notication";
import { logger } from "../libs/helpers";
import Wallet, { IWallet } from "../Models/Wallet";
import { WalletService } from "../components/wallet/services/wallet";
import { ISeller } from "../components/seller/interface";
import { calculateRate } from "./currencyRate";

export const findIfEmailExist = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User does not exist");
  }
  return user;
};

export const validateUser = async (
  otp: number,
  id: mongoose.Types.ObjectId
) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User does not exist");
  }
  if (user && user.otp !== otp) {
    throw new Error("Invalid otp");
  }
  return User.findByIdAndUpdate(id, { isVerified: true });
};
export const findIfAdminExist = async (email: string) => {
  const admin = await Admin.findOne({ email });
  if (!admin) throw new Error("Admin does not exist");
  return admin;
};
export const validateAdmin = async (
  otp: number,
  id: mongoose.Types.ObjectId
) => {
  const admin: IAdmin | null = await Admin.findById(id);
  if (!admin) throw new Error("Admin does not exist");
  if (admin && admin.otp !== otp) throw new Error("Invalid OTP");
  return admin;
};

export const findIfEmailExistAndIsVerified = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User does not exist");
  }
  if (user.isVerified === true) {
    throw new Error("User already verified");
  }
  const otp = generateOtp();
  try {
    await verifyEmail(user.phone, user.email, otp);
    await User.findByIdAndUpdate(user._id, { otp });
  } catch (e) {
    console.log(e);
  }
  return otp;
};

export const updateOrders = async () => {
  let orders: IOrder[] = await Order.find({});

  let len: number = orders.length;
  for (len; len--;) {
    const date = getTimeDiff(orders[len].createdAt);
    if (orders[len].shipping == "Express") {
      if (date > 1) {
        await orderUpdate(orders[len]._id);
      }
    } else {
      if (date > 2) {
        await orderUpdate(orders[len]._id);
      }
    }
  }
};

const orderUpdate = async (_id: any) => {
  const order = await Order.findById(_id);
  if (order) {
    order.active = true;
    await order.save();
  }
}

export const updateShipping = async () => {
  logger.info("Updating shipping is called every 2mins");
  const orders: IOrder[] = await Order.find({ status: "processed" });
  let orderLength: number = orders.length;
  for (orderLength; orderLength--;) {
    const { updateShipping, shipping, updated } = orders[orderLength];
    const timeDiff = getTimeDiff(updateShipping);
    if (shipping === "Express" && updated && timeDiff > 1) {
      logger.info(`I tried updating this order ${shipping}`);
      orders[orderLength].status = "shipped";
      await orders[orderLength].save();
      await WalletService.updateAvailablePayout({ orderId: orders[orderLength]._id });
    }
    if (shipping === "Standard" && updated && timeDiff > 2) {
      orders[orderLength].status = "shipped";
      await orders[orderLength].save();
      await WalletService.updateAvailablePayout({ orderId: orders[orderLength]._id });
    }
  }
};

export const updateHotdeals = async () => {
  try {
    let products = await Product.find({ hot: true });
    let productLength: number = products.length;
    for (productLength; productLength--;) {
      const { productUpdatedDate } = products[productLength];
      if (getTimeDiff(productUpdatedDate) > 720) {
        // Re-fetch the product from the database
        const product = await Product.findById(products[productLength]._id);
        if (product) {
          product.hot = false;
          await product.save();

          // Update the product in the array
          products[productLength] = product;
        } else {
          console.error(
            `No product found with ID ${products[productLength]._id}`
          );
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};

export const updateActivity = async () => {
  const orders: IOrder[] = await Order.find({ status: "shipped" });
  let length: number = orders.length;
  for (length; length--;) {
    const date: number = getTimeDiff(orders[length].createdAt);
    const { productId, sellerId, shippingCost, amount } = orders[length];
    const store = await Store.findOne({ owner: sellerId });
    const seller = await Seller.findById(store?.owner);
    const feeRate: number = seller?.package === "free" ? 10 : 5;
    if (date > 216 && !orders[length].activity) {
      orders[length].activity = true;
      const bill: number = shippingCost + amount - (feeRate / 100) * amount;
      const activity = new Activity({
        sellerId,
        productId,
        bill,
      });
      await activity.save();
      orders[length].save();
      const store: IStore | null = await Store.findOne({ owner: sellerId });
      if (!store) return;
      store!.balance = store!.balance + bill;
      await store.save();
    }
  }
};
export const createCheckoutSession = async (
  customer: string,
  price: string,
  type: string
) => {
  const success_url = type
    ? `${baseUrl}seller/renewal/success`
    : `${baseUrl}seller/payment/success`;
  const cancel_url = type
    ? `${baseUrl}seller/renewal/cancel`
    : `${baseUrl}seller/payment/cancel`;
  try {
    const session = await stripe.checkout.sessions.create({
      customer,
      mode: "subscription",
      // payment_method_types: ['card'],
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      success_url,
      cancel_url,
    });
    return session;
  } catch (e) {
    console.log(e);
  }
};
export const createPaymentCheckout = async (
  customer: string,
  priceData: any
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      customer,
      mode: "payment",
      line_items: priceData,
      success_url: `${baseUrl}account/rate`,
      cancel_url: `${baseUrl}seller/payment/cancel`,
    });
    return session;
  } catch (e) {
    console.log(e);
  }
};

export const generateRandomX = (length: number): string => {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

export const checkSubscription = (endDate: Date): boolean => {
  const currentDate = new Date();
  const twoDaysAfterEnd = new Date(endDate);
  twoDaysAfterEnd.setDate(twoDaysAfterEnd.getDate() + 2);

  if (currentDate > twoDaysAfterEnd) {
    return true;
  } else {
    return false;
  }
};

// Usage example
const subscriptionEndDate = new Date("2023-07-10"); // Replace with the actual subscription end date
checkSubscription(subscriptionEndDate);

const calculateTotal = (products: TProduct[]) =>
  products.reduce((a, b) => a + b.quantity, 0);

const orderPlacedNotification = async (
  email: string,
  products: any,
  address: string,
  user: any,
  shipping: string
) => {
  const symbol = (exchangeCurrency.find(c => c.label === user.currency))?.symbol ?? "$";
  
  const userCountry = (countryCurrency.find(c => c.abb == user.country))?.country;
  
  const userRate = await calculateRate(user.currency?.toLowerCase() ?? "usd")
  let productLength = products.length;
  let totalAmount = 0;
  let message = ""
  let shippingPrice = 0
  for (productLength; productLength--;) {
    const x = products[productLength];
    const sellerId = x.productId.owner.owner;
    const seller = await Seller.findById(sellerId);;
    const sellerCountry = seller?.location;

    const productRate = await calculateRate((x.productId.owner.currency)?.toLowerCase() ?? "usd")
    const { shipping: existingShipping } = x.productId;
    
    let shippingNewPrice: number = 0;
    if (userCountry == sellerCountry) {
      shippingNewPrice = x.productId.owner.domesticShipping.express
    } else {
      shippingNewPrice = shipping === "Standard" ? existingShipping[0].standard.price : existingShipping[0].express.price;
    }
    
    shippingPrice += productRate * shippingNewPrice / userRate;
    totalAmount += productRate * (x.price + shippingNewPrice) / userRate;
    const photo = x.photo;
    const orderDatas: IOrder[] = await Order.find({ productId: x.productId._id });
    const orderId = orderDatas[0]._id;

    message += `
            <tr>
                <td align="center" width="30%">
            <img src=${photo} alt="Product Image" style="display: block; width: 100%; height: auto; border-radius: 10px;">
                </td>
                <td align="left" style="padding: 10px;">
            <sub style="font-size: 10px; text-align: left;"> Order ID: ${orderId}</sub>
            <p style="font-size: 14px; margin: 0;">${x.name}</p>
            
            ${x.variants.length > 0 ?
        x.variants.map((y: any) => {
          return `<span style="font-size: 12px; margin: 0;">${y.variant} - ${y.option}</span>`;
        }).join("/")
        : ""
      }
            <p style="font-size: 12px; margin: 0;">Unit - ${x.quantity}</p>
                <p style="font-size: 12px; margin: 0;">${symbol} ${(x.price * productRate / userRate).toFixed(2)}</p>
            </td>   
            </tr>
            `;
  };

  const addr = await Address.findById(address);
  await OrderPlacedNotification(
    totalAmount,
    email,
    message,
    shipping,
    shippingPrice,
    addr,
    user
  );
};

const findSellerEmail = async (owner: mongoose.Types.ObjectId) => {
  try {
    const seller = await Seller.findById(owner);
    const sellerId = seller!._id;
    const user = await User.findOne({ sellerId });
    return user!.email;
  } catch (e) {
    console.log(e);
  }
};
export const extractDataForOrdersUpdate = async (order: IOrder) => {
  try {
    const {
      _id,
      userId,
      shippingProvider,
      shippingCost,
      shipping,
      productId,
      trackingId,
      variants,
      address,
      createdAt,
      quantity,
    } = order;

    const addressData = await Address.findById(address);
    const user = await User.findById(userId);
    const product: any = await Product.findById(productId).populate({
      path: "owner",
      model: Store,
      populate: {
        path: "owner",
        model: Seller,
      },
    });
    if (!product) return;

    // console.log(addressData);
    await updateOrderShippedNotification(
      _id,
      trackingId,
      shippingProvider,
      addressData,
      user,
      product,
      // @ts-ignore
      variants,
      shipping,
      shippingCost,
      createdAt,
      quantity
    );
  } catch (e) {
    console.log(e);
  }
};
export const sendOrderDeliveryNotification = async () => {
  try {
    const orders: IOrder[] = await Order.find({ status: "shipped" });
    let orderLength = orders.length;

    for (orderLength; orderLength--;) {
      const {
        shippingProvider,
        shippingCost,
        productId,
        userId,
        shipping,
        trackingId,
        variants,
        address,
        createdAt,
        quantity
      } = orders[orderLength];
      const product = await Product.findById(productId).populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      });
      if (!product) continue;
      const user = await User.findById(userId);
      orders[orderLength].status = "delivered";
      await orders[orderLength].save();
      await orderDeliveredSuccessfully(
        trackingId,
        shippingProvider,
        address,
        user,
        product,
        variants,
        shipping,
        shippingCost,
        createdAt,
        quantity
      );
    }
  } catch (e) {
    console.log(e);
  }
};
export const disableUnsoldProductsForFreePlanSellers = async () => {
  const productCreatedAt = getLastweek(60);
  try {
    const sellers: Iseller[] = await Seller.find({ package: "free" });

    let length: number = sellers.length;

    for (length; length--;) {
      const { _id } = sellers[length];
      const store: IStore | null = await Store.findOne({ owner: _id });
      if (!store) continue;
      if (store) {
        const products: IProduct[] = await Product.find({
          orders: 0,
          owner: store._id,
        });
        let productLength: number = products.length;
        for (productLength; productLength--;) {
          const { createdAt } = products[productLength];
          if (createdAt > productCreatedAt) {
            products[productLength].active = false;
            await products[productLength].save();
          }
        }
      }
    }
  } catch (error) { }
};

export const addToOrders = async (
  cart: ICart | null,
  email: string,
  user: any,
  address: string,
  shipping: string,
  donesticShipping: any
) => {
  if (!cart) return;
  const sellerIds = [];
  const products: any[] = cart!.products;
  const { bill } = cart;
  let productsLength = products.length;
  const shippingPrice: number[] = [];
  try {
    for (productsLength; productsLength--;) {
      const product = products[productsLength].productId
      if (!product) {
        throw new Error("Product not found");
      }
      const { productId, name, quantity, price, variants } = products[productsLength];
      let variantLength = variants.length;
      if (variantLength > 0) {
        for (variantLength; variantLength--;) {
          const { variant, option } = variants[variantLength];
          //@ts-ignore
          const updateProduct: any | null = product?.variants.find(
            (x: any) => x.variant === variant && x.option === option
          );
          //@ts-ignore
          const updateProduct2: any[] = product?.variants.filter(
            (x: any) => x.variant !== variant && x.option !== option
          );
          product?.variants.forEach((x: any) => {
            if (x.variant === variant && x.option === option) {
              if (x.stock === 0) return;
              x.stock = x.stock - quantity;
            }
          });
          await product?.save();
        }
      }
      const { shipping: existingShipping, owner } = product!;
      let shippingNewPrice: number = 0;
      if (donesticShipping) {
        shippingNewPrice = product.owner.domesticShipping.standard
      } else {
        shippingNewPrice = shipping === "Standard"
          ? existingShipping[0].standard.price
          : existingShipping[0].express.price;
      }

      shippingPrice.push(shippingNewPrice);
      const newShipping = new Shipping({
        price: shippingNewPrice,
        storeId: owner._id,
      });
      await newShipping.save();
      if (product?.quantity <= 0) {
        throw new Error("Product is out of stock");
      }
      product!.quantity = product!.quantity - quantity;
      product!.orders = product!.orders + 1;
      await product?.save();
      const store: IStore | null = await Store.findById(owner._id);
      const sellerId = store!.owner;
      sellerIds.push(sellerId);
      const email: string | undefined = await findSellerEmail(sellerId);
      // @ts-ignore
      store?.sales = store?.sales + 1;
      await store?.save();
      const order = new Order({
        sellerId: owner._id as mongoose.Types.ObjectId,
        userId: user._id,
        productId: productId._id as mongoose.Types.ObjectId,
        name,
        shippingCost: shippingNewPrice,
        amount: bill,
        shipping,
        quantity,
        price,
        variants,
        address: new ObjectId(address),
      });
      await order.save();

      await WalletService.createWalletPayout({
        ownerId: owner._id,
        amount: quantity * price + shippingNewPrice,
        orderId: order._id,
      });

      await sellerOrderReceived(
        products[productsLength],
        email,
        shipping,
        shippingNewPrice,
        order._id
      );
    }
    await orderPlacedNotification(
      email,
      products,
      address,
      user,
      shipping
    );
    for (let i = 0; i < sellerIds.length; i++) {
      let info = sellerIds[i];
      const newNotification = new Notification({
        from: `seller-${info}`,
        to: "SELLER",
        senderRole: "SELLER",
        title: "Order Notification",
        content: "Order has been placed",
        isRead: false,
        sellerId: info,
      });
      await newNotification.save();
    }
    return sellerIds;
  } catch (e) {
    console.log(e);
  }
};
export const saveVerifiedSeller = async (
  user_id: mongoose.Types.ObjectId,
  endDate: Date,
  sub_id: string,
  plan: string
) => {
  try {
    const seller: Iseller | null = await Seller.findOne({ owner: user_id });
    if (!seller) {
      return;
    }
    seller.endDate = endDate;
    seller.isVerified = true;
    seller.subId = sub_id;
    seller.package = plan;
    await seller.save();
  } catch (e) {
    console.log(e);
  }
};
export const getBiggestNumber = (
  first: number,
  second: number,
  order: boolean
): number => {
  if (order) return first > second ? first : second;
  else return first > second ? second : first;
};

export const replaceNull = (value: number): number => (value ? value : 0);

export const getTotalSales = (orders: IOrder[]) =>
  orders.reduce((partial, a) => partial + a.price * a.quantity, 0);
export const getTotalShippingPrice = (order: IOrder[]) =>
  order.reduce((a, b) => a + b.shippingCost, 0);
export const getOrdersRange = async (
  firstDate: Date,
  secondDate: number | Date
): Promise<IOrder[]> => {
  const orders = await Order.find({
    createdAt: {
      $gte: firstDate,
      $lte: secondDate,
    },
  });
  return orders;
};

export const getOrdersRangeForSeller = async (
  firstDate: Date,
  secondDate: number | Date,
  sellerId: mongoose.Types.ObjectId
): Promise<IOrder[]> => {
  const orders = await Order.find({
    createdAt: {
      $gte: firstDate,
      $lte: secondDate,
    },
    sellerId,
  }).or([
    { status: "shipped" },
    { status: "delivered" },
    { status: "processed" },
  ]);
  return orders;
};
export const getSellerRange = async (
  firstDate: Date,
  secondDate: number | Date
): Promise<Iseller[]> => {
  const sellers: Iseller[] = await Seller.find({
    createdAt: {
      $gte: firstDate,
      $lte: secondDate,
    },
  });
  return sellers;
};
export const getUserRange = async (
  firstDate: Date,
  secondDate: number | Date
): Promise<Iuser[]> => {
  const users: Iuser[] = await User.find({
    createdAt: {
      $gte: firstDate,
      $lte: secondDate,
    },
  });
  return users;
};
export const getUserByCountry = async (): Promise<Iuser[]> => {
  const users: Iuser[] = await User.aggregate([
    {
      $match: {
        country: { $ne: null },
        sellerId: { $exists: false }
      }
    },
    {
      $group: {
        _id: "$country",
        userCount: { $sum: 1 }
      }
    },
    {
      $sort: { userCount: -1 }
    },
    {
      $limit: 7
    }
  ]);;
  return users;
};
export const getSellerByCountry = async (): Promise<Iuser[]> => {
  const users: Iuser[] = await User.aggregate([
    {
      $match: {
        country: { $ne: null },
        sellerId: { $exists: true }
      }
    },
    {
      $group: {
        _id: "$country",
        userCount: { $sum: 1 }
      }
    },
    {
      $sort: { userCount: -1 }
    },
    {
      $limit: 7
    }
  ]);;
  return users;
};
export const getRefundRange = async (
  storeId: mongoose.Types.ObjectId,
  firstDate: Date,
  secondDate: number | Date
): Promise<IRefund[]> => {
  const refunds: IRefund[] = await Refund.find({
    createdAt: {
      $gte: firstDate,
      $lte: secondDate,
    },
    storeId,
  });
  return refunds;
};
export const getProductRange = async (
  firstDate: Date,
  secondDate: number | Date
): Promise<IProduct[]> => {
  const products: IProduct[] = await Product.find({
    createdAt: {
      $gte: firstDate,
      $lte: secondDate,
    },
  });
  return products;
};
const handleSortRep = async (
  sellerId: mongoose.Types.ObjectId
): Promise<void> => {
  const orders: IOrder[] = await Order.find({ sellerId });
  const sold: number = orders.length;
  const store: IStore | null = await Store.findOne({ owner: sellerId });
  if (sold >= 20 && sold < 100) {
    store!.sold = sold;
    store!.reputation = store!.reputation + 2;
    await store!.save();
    return;
  }
  if (sold < 20) return;
  if (sold - store!.sold >= 100) {
    store!.reputation = store!.reputation + 2;
    store!.sold = sold;
    await store!.save();
  }
  const getLastMonth = getLastweek(28);
  const refunds: IRefund[] = await getRefundRange(
    store!._id,
    getLastMonth,
    Date.now()
  );
  if (store!.lastCheck < 28) return;
  if (refunds.length > 10) {
    store!.lastCheck = 1;
    store!.reputation = store!.reputation - 4;
    await store!.save();
  }
};
const deleteCartProduct = async (productId: mongoose.Types.ObjectId) => {
  const cart: ICart[] = await Cart.find({ "products.productId": productId });
  let cartLength: number = cart.length;
  for (cartLength; cartLength--;) {
    const productIndex: number = cart[cartLength].products.findIndex(
      (product) => product.productId === productId
    );
    if (productIndex > -1) {
      let product = cart[cartLength].products[productIndex];
      cart[cartLength].bill -= product.quantity * product.price;
      if (cart[cartLength].bill < 0) {
        cart[cartLength].bill = 0;
      }
      cart[cartLength].products.splice(productIndex, 1);
      cart[cartLength].bill = cart[cartLength].products.reduce(
        (acc, cur) => acc + cur.quantity * cur.price,
        0
      );
      await cart[cartLength].save();
    }
  }
};
const deleteWish = async (productId: mongoose.Types.ObjectId) => {
  await Wish.deleteMany({ productId });
};

export const updateCart = async () => {
  const products: IProduct[] = await Product.find({ quantity: 0 });
  let productLength: number = products.length;
  for (productLength; productLength--;) {
    await deleteCartProduct(products[productLength]._id);
    await deleteWish(products[productLength]._id);
  }
};

export const handleSetSellerRep = async () => {
  const orders: IOrder[] = await Order.find({});
  let length: number = orders.length;
  for (length; length--;) {
    await handleSortRep(orders[length].sellerId);
  }
};
export const days_passed = (dt: Date): number => {
  let current = new Date(dt.getTime());
  let previous = new Date(dt.getFullYear(), 0, 1);

  // @ts-ignore
  return Math.ceil((current - previous + 1) / 86400000);
};
type IRound = {
  dec: number;
  number: number;
};
export const round = (N: number): any => {
  const fixed = N.toFixed(0);
  const length = fixed.toString().length;
  if (length === 1) return N;
  const numerHolder: IRound[] = [
    {
      number: 2,
      dec: 10,
    },
    {
      number: 3,
      dec: 100,
    },
    {
      number: 4,
      dec: 1000,
    },
    {
      number: 5,
      dec: 100000,
    },
    {
      number: 6,
      dec: 1000000,
    },
  ];
  const round: IRound | undefined = numerHolder.find(
    (num) => num.number === length
  );
  const ceil = Math.ceil(N / round!.dec) * round!.dec;
  let str = ceil.toString().slice(0, -3);
  return parseInt(str);
};
export const createPortal = async (
  name: string
): Promise<Stripe.Response<Stripe.BillingPortal.Configuration>> => {
  const configuration: Stripe.Response<Stripe.BillingPortal.Configuration> =
    await stripe.billingPortal.configurations.create({
      features: {
        subscription_update: {
          default_allowed_updates: [],
          enabled: true,
          products: "",
          proration_behavior: "none",
        },
        subscription_cancel: {
          cancellation_reason: {
            enabled: true,
            options: [],
          },
          enabled: true,
          mode: "at_period_end",
        },
      },
      business_profile: {
        headline: `Hi ${name}, Welcome to your portal`,
        privacy_policy_url: `${baseUrl}/policy`,
        terms_of_service_url: `${baseUrl}/terms`,
      },
    });
  return configuration;
};

export const updateStoreActivity = async () => {
  let stores = await Store.find({});
  let storeLength: number = stores.length;
  for (storeLength; storeLength--;) {
    const lastUpdated = getTimeDiff(stores[storeLength].updatedAt);
    if (lastUpdated > 6) {
      // Re-fetch the store from the database
      const store = await Store.findById(stores[storeLength]._id);
      if (store) {
        store.disabled = false;
        await store.save();

        // Update the store in the array
        stores[storeLength] = store;
      }
    }
  }
};

export const deleteInvalidStores = async () => {
  const stores: IStore[] = await Store.find({});
  let storeLength: number = stores.length;
  for (storeLength; storeLength--;) {
    const { owner } = stores[storeLength];
    const seller: Iseller | null = await Seller.findById(owner);
    if (!seller) {
      stores[storeLength].delete();
    }
  }
};

export const deleteInvalidProductsRating = async () => {
  const ratings: IRating[] = await Rating.find({});
  let length: number = ratings.length;
  for (length; length--;) {
    const { productId } = ratings[length];
    const product = await Product.findById(productId);
    if (product) continue;
    if (!productId) {
      ratings[length].delete();
      continue;
    }
    Rating.deleteMany({ productId });
  }
};

export const deleteInvalidProductsReviews = async () => {
  const reviews: IReview[] = await Review.find({});
  let length: number = reviews.length;
  for (length; length--;) {
    const { productId } = reviews[length];
    const product = await Product.findById(productId);
    if (product) continue;
    await reviews[length].delete();
    Review.deleteMany({ productId });
  }
};

export const deleteInvalidProductOrders = async () => {
  const orders: IOrder[] = await Order.find({});
  let length: number = orders.length;
  for (length; length--;) {
    const { productId } = orders[length];
    const product = await Product.findById(productId);
    if (product) continue;
    await orders[length].delete();
    Order.deleteMany({ productId });
  }
};

export const deleteInvalidProductActivity = async () => {
  const activities: IActivity[] = await Activity.find({});
  let length: number = activities.length;
  for (length; length--;) {
    const { productId } = activities[length];
    const product = await Product.findById(productId);
    if (product) continue;
    await activities[length].delete();
  }
};
export const deleteInvalidProductRefund = async () => {
  const refunds: IRefund[] = await Refund.find({});
  let length: number = refunds.length;
  for (length; length--;) {
    const { productId } = refunds[length];
    const product = await Product.findById(productId);
    if (product) continue;
    await refunds[length].delete();
  }
};
export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
export function unCapitalizeFirstLetter(string: string): string {
  return string.charAt(0).toLowerCase() + string.slice(1);
}

export const updateUserCart = async (
  owner: mongoose.Types.ObjectId,
  productId: string,
  sign: boolean
) => {
  try {
    const cart: ICart | null = await Cart.findOne({ owner });
    const product: IProduct | null = await Product.findOne({
      _id: new ObjectId(productId),
    });
    if (!product) {
      throw new Error("Product not found");
    }

    // const price : number = product.price;
    const productQuantity: number = product.quantity;
    if (cart) {
      const productIndex: number = cart.products.findIndex(
        (product) => product.productId.toHexString() === productId
      );
      if (productIndex > -1) {
        let product = cart.products[productIndex];
        if (sign && product.quantity + 1 > productQuantity) {
          throw new Error("Product quantity exceeded");
        }
        product.quantity = sign ? product.quantity + 1 : product.quantity - 1;
        cart.bill = cart.products.reduce(
          (acc, cur) => acc + cur.quantity * cur.price,
          0
        );
        cart.products[productIndex] = product;
        await cart.save();
      }
    }
  } catch (e) {
    console.log(e);
    throw new Error("Something went error" + e);
  }
};

export const deactivateSellerProducts = async (store: IStore) => {
  try {
    const products: IProduct[] = await Product.find({ owner: store._id });

    let productLength = products.length;

    for (productLength; productLength--;) {
      products[productLength].active = !products[productLength].active;
      await products[productLength].save();
    }
  } catch (error) { }
};

export const updateProductStatus = async () => {
  const sellers: ISeller[] = await Seller.find({ package: "free" });
  for (const seller of sellers) {
    const store = await Store.findOne({ owner: seller._id });
    if (!store) {
      logger.info(`store not found for seller ${seller._id}`);
    } else {
      await getProductByStoreId(String(store?._id));
    }
  }
};

const getProductByStoreId = async (storeId: string) => {
  const products: IProduct[] = await Product.find({
    owner: storeId,
    active: true,
    publish: true,
  });

  // logger.info(`store products ${products.length}`);

  for (const product of products) {
    const order = await Order.findOne({ productId: product._id }).sort({
      createdAt: -1,
    });
    if (!order) {
      logger.info(`no order from this product ${product._id}`);
    } else {
      await updateProductByOrderDate(order?.createdAt, product._id);
    }
  }
};

const updateProductByOrderDate = async (orderDate: Date, productId: string) => {
  const date: number = getTimeDiff(orderDate);
  const twentyDays = 24 * 20;
  if (date > twentyDays) {
    await Product.updateOne(
      { _id: productId },
      {
        $set: {
          active: false,
        },
      }
    );
  }
};
