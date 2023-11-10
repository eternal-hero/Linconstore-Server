import express, { Request, Response, Router } from "express";
import { adminAuth } from "../Middleware/auth";
import Contact, { IContact } from "../Models/Contact";
import User, { Iuser } from "../Models/User";
import Admin, { IAdmin } from "../Models/Admin";
import { stripe } from "../app";
import Order, { IOrder } from "../Models/Order";
import Feedback, { IFeedback } from "../Models/Feedback";
import ReplyContact, { IReplyContact } from "../Models/ReplyContact";
import {
  days_passed,
  deactivateSellerProducts,
  findIfAdminExist,
  generateRandomX,
  getBiggestNumber,
  getOrdersRange,
  getSellerRange,
  getSellerByCountry,
  getUserByCountry,
  getTotalSales,
  getUserRange,
  replaceNull,
  round,
  sendOrderDeliveryNotification,
  validateAdmin,
} from "../Helpers/helpers";
import Seller, { Iseller } from "../Models/Seller";
import Rating, { IRating } from "../Models/Rating";
import Refund, { IRefund } from "../Models/Refund";
import Store, { IStore } from "../Models/Store";
import Product, { IProduct } from "../Models/Product";
import RequestFile from "../Models/RequestFile";
import {
  getLastweek,
  getMonthStartDates,
  getTimeDiff,
  roundUpNumber,
} from "../Helpers/TimeDiff";
import { replyAdminContact } from "../Helpers/verifyUser";
import { generateOtp } from "../Helpers/generateOtp";
import {
  ReUpdateIdentityVerification,
  UpdateIdentityVerification,
  UpdateVerificationSuccessful,
  verifyAdmin,
} from "../Helpers/verifyUser";
import Category from "../Models/Category";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import Activity from "../Models/Activity";
import Review from "../Models/Review";
import { Wallet, WalletEntry } from "../components/wallet/models";
import { WalletService } from "../components/wallet/services/wallet";
import { sendNotification } from "../socket";
import { NOTIFICATION_TARGET } from "../socket/types";
import Notification from "../Models/Notication";
import Transaction, { ITransaction } from "../Models/Transaction";

interface myData {
  seller: Iseller;
  pendingBalance: number;
  availBalance: number;
  payoutRequest: number;
  length: number;
  status: string;
}
const router: Router = express.Router();
router.get("/contacts", adminAuth, async (req: Request, res: Response) => {
  try {
    const contacts: IContact[] = await Contact.find({ active: true }).sort({ createdAt: "desc" });
    res.status(200).send(contacts);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/admin/create", async (req: Request, res: Response) => {
  const username: string = generateRandomX(5);
  const admin = new Admin({ ...req.body, username });
  try {
    await admin.save();
    const token: string = await admin.generateAuthToken();
    res.status(200).send({ admin, token });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/admin/updatedBalance", async (req: Request, res: Response) => {
  const storeId = req.body.storeId;
  const amount = req.body.amount;
  const currency = req.body.currency;
  const destination = req.body.destination;
  try {
    const resposne = await WalletEntry.findOneAndUpdate({ ownerId: storeId, orderId: null }, { $set: { status: "Approve" } });

    const updatedTransaction = await Transaction.findOneAndUpdate({ storeId: storeId }, { $set: { status: "Approve" } });
    const walletBalance = await Wallet.findOne({ ownerId: storeId, status: "PENDING" });
    const updatedBalance: number = Number(walletBalance?.balance) - Number(amount);
    const updatedWallet = await Wallet.findOneAndUpdate({ ownerId: storeId }, { balance: updatedBalance });
    
    res.status(200).send(resposne)
  } catch (e) {
    res.status(403).send(e);
  }
})

router.patch(
  "/admin/edit/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const selectedId = req.params.id;
    const { id, otp, email, section, password, region, language } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) return res.status(403).send({ status: "Can't get delete" });
    const adminVerify = await validateAdmin(parseInt(otp), admin._id);
    if (!adminVerify) {
      return res.status(401).send("Invalid updates");
    }
    try {
      let selAdmin = await Admin.findById(selectedId);
      if (!selAdmin) return res.status(403).send({ status: "Can't get delete" });
      selAdmin.email = email;
      selAdmin.section = section;
      selAdmin.password = password;
      selAdmin.region = region;
      selAdmin.language = language;
      await selAdmin.save();
      res.status(200).send(selAdmin);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.post("/admin/delete", adminAuth, async (req: Request, res: Response) => {
  const { id, verifyCode, selectedId } = req.body;
  try {
    const admin = await Admin.findById(id);
    if (!admin) return res.status(403).send({ status: "Can't get delete" });
    const adminVerify = await validateAdmin(parseInt(verifyCode), admin._id);
    if (adminVerify) {
      const delAdmin = await Admin.findByIdAndDelete(selectedId);
      res.status(200).send(delAdmin);
    }
    res.status(401).send({ status: "Something went wrong" });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/admins", adminAuth, async (req: Request, res: Response) => {
  try {
    const admins: IAdmin[] = await Admin.find({ section: { $ne: "superAdmin" } }).sort({ createdAt: "desc" });
    res.status(200).send(admins);
  } catch (e) {
    res.status(401).send(e);
  }
});
router.get("/admin/id/:id", adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const admin = await Admin.findById(id);
    res.status(200).send(admin);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/admin/stores", adminAuth, async (req: Request, res: Response) => {
  try {
    const stores: IStore[] = await Store.find({});
    res.status(200).send(stores);
  } catch (e) {
    res.status(500).send({ message: "Something went wrong" });
  }
});

router.get("/admin/transactions", adminAuth, async (req: Request, res: Response) => {
  try {
    const transactions: ITransaction[] = await Transaction.find({});
    console.log(transactions)
    res.status(200).send(transactions);
  } catch (e) {
    res.status(500).send({ message: "Something went wrong" });
  }
});

router.post("/admin/verifyCode", async (req: Request, res: Response) => {
  const { id, user } = req.body;
  const otp = generateOtp();
  try {
    const admin = await Admin.findById(id);
    if (!admin) return res.status(403).send({ status: "Can't get verification code" });
    admin.otp = otp;
    admin.save();
    // const email = "jact6313@gmail.com";
    const email = "admin@linconstore.com"
    await verifyAdmin(otp, email);
    res.status(200).send(user);
  } catch (e) {
    res.status(500).send({ status: "Unable to login" });
  }
});

router.post("/admin/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const otp = generateOtp();
  try {
    const admin: IAdmin = await Admin.findByCredentials(email, password);
    admin.otp = otp;
    await verifyAdmin(otp, admin.email);
    await admin.save();
    res.status(200).send(admin);
  } catch (e) {
    res.status(500).send({ status: "Unable to login" });
  }
});
router.post("/admin/verify", async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const admin: IAdmin = await findIfAdminExist(email);
    const adminVerify = await validateAdmin(parseInt(otp), admin._id);
    if (adminVerify) {
      const token = await adminVerify.generateAuthToken();
      return res.status(200).send({ adminVerify, token });
    }
    res.status(401).send({ status: "Something went wrong" });
  } catch (e) {
    res.status(400).send({ status: e });
  }
});
// router.get('/admin/orders', adminAuth, async (req: Request, res: Response) => {
//     const status = req.query.status;
//     try {
//         const orders: IOrder[] = await Order.find({ status });
//         res.status(200).send(orders);
//     }
//     catch (e) {
//         res.status(401).send(e)
//     }
// })
router.get(
  "/admin/allorders",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const orders: IOrder[] = await Order.find()
        .sort({ createdAt: "desc" })
        .populate({
          path: "productId",
          model: Product,
          populate:
          {
            path: "owner",
            model: Store,
          }
        });
      let resOrders = orders.filter((order) => order.productId)
      res.status(200).send(resOrders);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.patch(
  "/admin/cancel/order/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      const order: IOrder | null = await Order.findById(id);
      if (!order) {
        return res.status(404).send("Order Not found");
      }
      const date = getTimeDiff(order.createdAt);
      if (date > 12) {
        return res.status(401).send("Sorry time has elapsed");
      }
      order.status = "cancelled";
      order.save();
      // const notification = new Notification({
      //     to: order.userId,
      //     from: 'System',
      //     message: `Your order ${order._id} has been cancelled `
      // })
      // notification.save();
      res.status(200).send(date);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
// router.get('/admin/user/stats', adminAuth, async (req: Request, res : Response) => {
//     try {
//         const lastweek  : Date = getLastweek(7);
//         const users =  await  User.find({
//             createdAt : {
//                 $gte: Date.now(),
//                 $lte: lastweek
//             }
//         })
//
//     }
// })
router.get("/admin/user/stats", async (req: Request, res: Response) => {
  try {
    const lastweek: Date = getLastweek(7);
    const twoWeeks: Date = getLastweek(14);

    const usersByCountry = await getUserByCountry();
    const sellersByCountry = await getSellerByCountry();
    const sellersLastWeek = await getSellerRange(lastweek, Date.now());
    const sellersTwoWeeks = await getSellerRange(twoWeeks, lastweek);
    const userLastWeek: Iuser[] = await getUserRange(lastweek, Date.now());
    const userTwoWeeks: Iuser[] = await getUserRange(twoWeeks, lastweek);
    const userPrev: number = userTwoWeeks.length;
    const userNext: number = userLastWeek.length;
    const sellerPrev: number = sellersTwoWeeks.length;
    const sellerNext: number = sellersLastWeek.length;
    const userStats: number = replaceNull(
      100 -
      (100 / getBiggestNumber(userPrev, userNext, true)) *
      getBiggestNumber(userPrev, userNext, false)
    );
    const sellerStats: number = replaceNull(
      100 -
      (100 / getBiggestNumber(sellerPrev, sellerNext, true)) *
      getBiggestNumber(sellerPrev, sellerNext, false)
    );
    const userSign: boolean = userNext > userPrev;
    const sellerSign: boolean = sellerNext > sellerPrev;
    const orderLastWeek: IOrder[] = await getOrdersRange(lastweek, Date.now());
    const orderTwoWeeks: IOrder[] = await getOrdersRange(twoWeeks, lastweek);
    const orderPrev: number = orderTwoWeeks.length;
    const orderNext: number = orderLastWeek.length;
    const orderStats: number = replaceNull(
      100 -
      (100 / getBiggestNumber(orderPrev, orderNext, true)) *
      getBiggestNumber(orderPrev, orderNext, false)
    );
    const orderSign: boolean = orderNext > orderPrev;
    res.status(200).send({
      userNext,
      sellerNext,
      orderNext,
      userStats,
      sellerStats,
      userSign,
      usersByCountry,
      sellersByCountry,
      sellerSign,
      orderSign,
      orderStats,
    });
  } catch (e) {
    res.status(500).send(e);
  }
});

// router.get('/admin/orders/yearlystats', adminAuth, async (req: Request, res: Response) => {
//     const getLastMonth = getLastweek(28);
//     const getLast2Month = getLastweek(28 * 2);
//     const getLast3Month = getLastweek(28 * 3);
//     const getLast4Month = getLastweek(28 * 4);
//     const getLast5Month = getLastweek(28 * 5);
//     const getLast6Month = getLastweek(28 * 6);
//     try {
//         const now: number = Date.now();
//         const orderLastMonth: IOrder[] = await getOrdersRange(getLastMonth, now)
//         const orderLast2Month: IOrder[] = await getOrdersRange(getLast2Month, getLastMonth);
//         const orderLast3Month: IOrder[] = await getOrdersRange(getLast3Month, getLast2Month);
//         const orderLast4Month: IOrder[] = await getOrdersRange(getLast4Month, getLast4Month);
//         const orderLast5Month: IOrder[] = await getOrdersRange(getLast5Month, getLast4Month);
//         const orderLast6Month: IOrder[] = await getOrdersRange(getLast6Month, getLast5Month);
//         const dec: number = getTotalSales(orderLastMonth);
//         const nov: number = getTotalSales(orderLast2Month);
//         const oct: number = getTotalSales(orderLast3Month);
//         const sept: number = getTotalSales(orderLast4Month);
//         const aug: number = getTotalSales(orderLast5Month);
//         const july: number = getTotalSales(orderLast6Month);
//         res.status(200).send({ dec, nov, oct, sept, aug, july })
//     }
//     catch (e) {
//         res.status(500).send(e)
//     }
// })
router.get("/admin/delete/stores", async (req: Request, res: Response) => {
  try {
    const sellers: Iseller[] = await Seller.find({});
    let sellerLength = sellers.length;
    for (sellerLength; sellerLength--;) {
      const { _id } = sellers[sellerLength];
      const store: IStore | null = await Store.findOne({ owner: _id });
      if (!store) {
        sellers[sellerLength].delete();
      }
    }
    res.status(200).send("ok");
  } catch (e) {
    res.status(200).send(e);
  }
});
router.get(
  `/admin/orders/stats`,
  adminAuth,
  async (req: Request, res: Response) => {
    const days: number = days_passed(new Date());
    const lastYear = getLastweek(days);
    try {
      const now: number = Date.now();
      const orderLastYear: IOrder[] = await getOrdersRange(lastYear, now);
      const totalSales: number = getTotalSales(orderLastYear);
      res.status(200).send({ totalSales, totalOrders: orderLastYear.length });
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.get("/admin/yearly", async (req: Request, res: Response) => {
  const months = getMonthStartDates() as Date[];
  try {
    const data: number[] = [];
    if (months.length === 1) {
      const orderLast: IOrder[] = await getOrdersRange(months[0], Date.now());
      const getTotalSale = getTotalSales(orderLast);
      data.push(round(getTotalSale));
      return res.status(200).send(data);
    }
    for (let i = 0; i < months.length; i++) {
      if (i + 1 === months.length) continue;
      const orderLast: IOrder[] = await getOrdersRange(
        months[i],
        months[i + 1]
      );
      const getTotalSale = getTotalSales(orderLast);
      data.push(roundUpNumber(getTotalSale));
    }
    res.status(200).send(data);
  } catch (e) {
    res.status(500).send(e);
  }
});
const getMonthName = (monthNumber: number) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return monthNames[monthNumber - 1];
};
router.get(
  "/admin/user/stats",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const lastweek: Date = getLastweek(7);
      const sellers = await Seller.find({
        createdAt: {
          $gte: Date.now(),
          $lte: lastweek,
        },
      });
      res.status(200).send(sellers);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.get("/admin/user", adminAuth, async (req: Request, res: Response) => {
  try {
    const seller = await User.find({});
    res.status(200).send(seller);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/admin/ratings", adminAuth, async (req: Request, res: Response) => {
  try {
    const ratings = await Review.find({})
      .populate({
        model: Store,
        path: "owner",
      })
      .populate({
        path: "productId",
        model: Product,
      });
    res.status(200).send(ratings);
  } catch (e) {
    res.status(401).send(e);
  }
});
router.get("/admin/refund", adminAuth, async (req: Request, res: Response) => {
  try {
    const refunds: IRefund[] = await Refund.find({})
      .populate({
        path: "productId",
        model: Product,
        populate:
        {
          path: "owner",
          model: Store,
          populate: {
            path: "owner",
            model: Seller,
            populate: {
              path: "owner",
              model: User,
            },
          },
        }
      })
      .populate({
        path: "storeId",
        model: Store,
      })
      .populate({
        path: "userId",
        model: User,
      });
    res.status(200).send(refunds);
  } catch (e) {
    res.status(400).send(e);
  }
});
router.patch(
  "/admin/refund/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const status: string = req.body.status;
    const id = req.params.id;
    try {
      const refund: IRefund | null = await Refund.findById(id);
      if (!refund) {
        return res.status(404).send("Not Found");
      }
      refund!.status = status;
      await refund!.save();
      res.status(200).send(refund);
    } catch (e) {
      res.status(400).send(e);
    }
  }
);
router.delete(
  "/admin/refund/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const refund = await Refund.findByIdAndDelete(id);
      res.status(200).send(refund);
    } catch (e) {
      res.status(400).send(e);
    }
  }
);
router.get(
  "/admin/products",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const products: IProduct[] = await Product.find({ active: true })
        .where("quantity")
        .gt(0)
        .sort({ updatedAt: "desc" })
        .populate({
          path: "category",
          model: Category,
        })
        .populate({
          path: "owner",
          model: Store,
        });
      res.status(200).send(products);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.patch(
  "/admin/product/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      const product: IProduct | null = await Product.findById(id);
      if (!product) return res.status(404).send("Product does not exist");
      product.publish = !product.publish;
      product.save();
      const products = await Product.findByIdAndUpdate(id, {
        publish: req.body.publish,
      });
      res.status(200).send(products);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.get("/admin/users", adminAuth, async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    let usersLength: number = users.length;
    const newUsers = [];
    for (usersLength; usersLength--;) {
      const order: IOrder[] = await Order.find({
        userId: users[usersLength]._id,
      });
      const lastOrders: IOrder[] = await Order.find({
        userId: users[usersLength]._id,
      }).sort({ createdAt: "desc" }).limit(3)
        .populate({
          path: "productId",
          model: Product,
        });
      newUsers.push({ users: users[usersLength], no: order.length, lastOrders: lastOrders });
    }
    res.status(200).send(newUsers);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch(
  "/admin/user/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    // const updates = Object.keys(req.body);
    const id = req.params.id;
    // const existing : string [] = ['isVerified'];
    // const isAllowed : boolean = updates.every(update => existing.includes(update));
    // if (!isAllowed){
    //     return res.status(402).send('Invalid updates')
    // }
    try {
      const user: Iuser | null = await User.findById(id);
      if (!user) return res.status(404).send("Not found");
      user.isVerified = !user.isVerified;
      user.save();
      res.status(200).send(user);
    } catch (e) {
      res.status(400).send(e);
    }
  }
);
router.delete(
  "/admin/user/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      const user = await User.findByIdAndDelete(id);
      const store = await Store.findOneAndDelete({ owner: id });
      if (store) {
        await Product.deleteMany({ owner: store._id });
      }
      res.status(200).send(user);
    } catch (e) {
      res.status(400).send(e);
    }
  }
);
interface IAdminSeller {
  store: IStore;
  length: number;
  lastProducts: IProduct[];
  balance: number;
}
router.get("/admin/sellers", adminAuth, async (req: Request, res: Response) => {

  try {
    const store: IStore[] = await Store.find({})
      .sort({ updatedAt: "asc" })
      .populate({
        path: "owner",
        model: Seller,
        populate: {
          path: "owner",
          model: User,
        },
      });
    if (store.length === 0) return res.status(200).send([]);
    let storeLength = store.length;
    const newData: IAdminSeller[] = [];
    for (storeLength; storeLength--;) {
      const _id = store[storeLength]?._id;
      const products: IProduct[] = await Product.find({ owner: _id });
      const lastProducts: IProduct[] = await Product.find({ owner: _id }).sort({ createdAt: "desc" }).limit(5);
      const storeOrders: any = (await WalletEntry.find({ ownerId: _id, status: "PROCESSED" }));
      let storeOrdersLength = storeOrders.length;
      let storeOrdersBalance: number = 0;
      for (storeOrders; storeOrdersLength--;) {
        storeOrdersBalance = storeOrdersBalance + storeOrders[storeOrdersLength].amountDue;
      }
      newData.push({ length: products.length, store: store[storeLength], lastProducts: lastProducts, balance: storeOrdersBalance });
    }
    res.status(200).send(newData);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch(
  "/admin/seller/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const status = req.body.status;
    try {
      const seller = await Seller.findById(id);
      if (!seller) res.status(404).send("Not found");
      // @ts-ignore
      seller?.isVerified = !seller?.isVerified;
      const store: IStore | null = await Store.findById(seller?.storeId);
      store!.isVerified = !store!.isVerified;
      await store!.save();
      seller?.save();
      res.status(200).send();
    } catch (e) {
      res.status(400).send(e);
    }
  }
);

router.patch(
  "/admin/seller/pausedPayout/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const status = req.body.status;
    try {
      const seller = await Seller.findById(id);
      if (!seller) res.status(404).send("Not found");
      // @ts-ignore
      seller?.isPausedPayout = !seller?.isPausedPayout;
      seller?.save();
      return res.status(200).send(seller);

      // // @ts-ignore
      // stripe.accounts.update(seller?.accId, {
      //   metadata: {
      //     payouts_enabled: seller?.isPausedPayout,
      //   }
      // }, (err: any, updatedAccount: any) => {
      //   if (err) {
      //     return res.status(401).send(err);
      //   } else {
      //     // @ts-ignore
      //     seller?.isPausedPayout = !seller?.isPausedPayout;
      //     seller?.save();
      //     return res.status(200).send(seller);
      //   }
      // });
    } catch (e) {
      res.status(400).send(e);
    }
  }
);

router.patch("/admin/productCategory/:id", adminAuth, async (req: Request, res: Response) => {
  let data = req.body;
  if (req.body.category) {
    const category = await Category.findOne({ title: req.body.category });
    data.category = category!._id
  }
  const updates: string[] = Object.keys(req.body);
  const existingUpdate: string[] = [
    "category",
    "subcategory",
  ];
  // const isPhoto : boolean =  updates.includes('photo');
  const isAllowed: boolean = updates.every((update) =>
    existingUpdate.includes(update)
  );
  if (!isAllowed) {
    return res.status(401).send("Invalid Updates");
  }
  const _id: string = req.params.id;
  try {
    const product: IProduct | null = await Product.findById(_id);
    if (!product) {
      return res.status(401).send("Product does not exist");
    }
    updates.forEach(
      (update) => ((product as any)[update] = data[update])
    );
    await product.save();
    res.status(200).send(product);
  } catch (e) {
    res.status(400).send(e);
  }
}
);

router.delete(
  "/admin/seller/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const _id = new ObjectId(id);
    try {
      const store: IStore | null = await Store.findById(_id);
      if (!store) {
        return res.status(404).send("Not Found");
      }
      const seller = await Seller.findOne({ storeId: store._id });
      const user: Iuser | null = await User.findOne({ sellerId: seller?._id });
      await user?.save();
      await Product.deleteMany({ owner: store!._id });
      await Store.findByIdAndDelete(id);
      res.status(200).send(store);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.get("/admin/reviews", adminAuth, async (req: Request, res: Response) => {
  try {
    const sellers: Iseller[] = await Seller.find()
      .sort({ updatedAt: "asc" })
      .populate({ path: "storeId", model: Store })
      .populate({
        path: "owner",
        model: User,
      });
    const newData: myData[] = [];
    let sellerLength: number = sellers.length;
    for (sellerLength; sellerLength--;) {
      const { storeId: store_id } = sellers[sellerLength];
      const store: IStore | null = await Store.findById(store_id);
      if (!store) continue;
      const wallets: any = await WalletEntry.find({ ownerId: store_id._id });
      let pendingBalance: number = 0;
      let availBalance: number = 0;
      let payoutRequest: number = 0;
      let walletsLength: number = wallets.length;
      let status: string = "";
      for (walletsLength; walletsLength--;) {
        status = wallets[walletsLength].status;
        if (wallets[walletsLength].status == "PENDING" && wallets[walletsLength].orderId) {
          pendingBalance = pendingBalance + wallets[walletsLength].amountDue;
        }
        if (wallets[walletsLength].status == "PENDING" && wallets[walletsLength].orderId == null) {
          payoutRequest = payoutRequest + wallets[walletsLength].amountDue;
        }
        if (wallets[walletsLength].status == "PROCESSED") {
          availBalance = availBalance + wallets[walletsLength].amountDue;
        }
        if (wallets[walletsLength].status == "Approve") {
          availBalance = availBalance - wallets[walletsLength].amountDue;
        }
      }
      const products: IProduct[] = await Product.find({ owner: store_id._id });
      const productLength: number = products.length;
      newData.push({
        seller: sellers[sellerLength],
        length: productLength,
        pendingBalance: pendingBalance,
        availBalance: availBalance,
        payoutRequest: payoutRequest,
        status: status
      });
    }
    res.status(200).send(newData);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/admin/verification", adminAuth, async (req: Request, res: Response) => {
  try {
    const sellers: Iseller[] = await Seller.find()
      .sort({ updatedAt: "asc" })
      .populate({ path: "storeId", model: Store })
      .populate({
        path: "owner",
        model: User,
      });
    const newData: myData[] = [];
    let sellerLength: number = sellers.length;
    for (sellerLength; sellerLength--;) {
      const { storeId: store_id } = sellers[sellerLength];
      const store: IStore | null = await Store.findById(store_id);
      if (!store) continue;
      const wallets: any = await WalletEntry.find({ ownerId: store_id._id });
      let pendingBalance: number = 0;
      let availBalance: number = 0;
      let walletsLength: number = wallets.length;
      let payoutRequest: number = 0;
      let status: string = "";

      for (walletsLength; walletsLength--;) {
        status = wallets[walletsLength].status;
        if (wallets[walletsLength].status == "PENDING") {
          pendingBalance = pendingBalance + wallets[walletsLength].amountDue;
        }
        if (wallets[walletsLength].status == "PENDING" && wallets[walletsLength].orderId == null) {
          payoutRequest = payoutRequest + wallets[walletsLength].amountDue;
        }
        if (wallets[walletsLength].status == "PROCESSED") {
          availBalance = availBalance + wallets[walletsLength].amountDue;
        }
      }
      const products: IProduct[] = await Product.find({ owner: store_id._id });
      const productLength: number = products.length;
      newData.push({
        seller: sellers[sellerLength],
        length: productLength,
        pendingBalance: pendingBalance,
        availBalance: availBalance,
        payoutRequest: payoutRequest,
        status: status
      });
    }
    res.status(200).send(newData);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch(
  "/admin/review/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      const seller: Iseller | null = await Seller.findOne({ _id: id });
      if (!seller) {
        return res.status(404).send("Not found");
      }
      seller!.isVerified = !seller.isVerified;
      await seller!.save();
      const store: IStore | null = await Store.findOne({ owner: seller!._id });
      if (!store) {
        return res.status(404).send("Not found");
      }
      store!.isVerified = !store.isVerified;
      await store!.save();
      await deactivateSellerProducts(store);
      res.status(200).send();
    } catch (e) {
      res.status(400).send(e);
    }
  }
);
router.patch(
  "/admin/seller/active/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id,
      active = req.query.active,
      isActive = active === "true";
    const _id = new ObjectId(id);
    try {
      if (active) {
        const request = await RequestFile.findOne({ sellerId: _id });
        await request?.delete();
      }
      const seller = await Seller.findByIdAndUpdate(id, { isActive });
      const user = await User.findOne({ sellerId: _id });
      const email = user!.email;
      const name = user!.firstName;
      isActive
        ? UpdateVerificationSuccessful(email, name)
        : ReUpdateIdentityVerification(email, name);
      res.status(200).send(seller);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.delete(
  "/admin/review/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      const store = await Store.findOne({ _id: id });
      if (!store) {
        return res.status(404).send("Store not found");
      }

      await Store.findByIdAndDelete(id);
      await Product.deleteMany({ owner: store._id });
      res.status(200).send();
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.get(
  "/admin/feedbacks",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const feedbacks = await Feedback.find({ active: true }).populate({
        path: "user",
        model: User,
      });
      res.status(200).send(feedbacks);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.patch(
  "/admin/feedback/:id",
  adminAuth,
  async (req: Request, res: Response) => {

    const id = req.params.id;
    try {
      const feedback: IFeedback | null = await Feedback.findById(id);
      if (!feedback) {
        return res.status(404).send("Not found");
      }
      feedback!.active = !feedback.active;
      await feedback!.save();
      res.status(200).send();
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.post(
  "/admin/request",
  adminAuth,
  async (req: Request, res: Response) => {
    const { sellerId } = req.body;
    try {
      await Seller.findByIdAndUpdate(sellerId, { isActive: false });
      const user: Iuser | null = await User.findOne({ sellerId });

      const email: string = user?.email as string;
      const name = user!.firstName;
      await UpdateIdentityVerification(email, name);
      const request = new RequestFile(req.body);
      await request.save();
      res.status(201).send(request);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.post("/admin/payout", adminAuth, async (req: Request, res: Response) => {
  const { type: name, amount, storeId } = req.body;
  try {
    const store: IStore | null = await Store.findById(storeId);
    if (!store) res.status(404).send({ message: "Store does not exist" });
    if (amount > store!.balance)
      return res
        .status(400)
        .send({ message: "Seller does not have up to this amount" });
    if (store!.balance - amount < 0)
      return res.status(400).send({ message: "cant deduct up to this amount" });
    store!.balance = store!.balance - amount;
    await store?.save();
    const activity = new Activity({
      name,
      bill: amount,
      type: "debit",
      sellerId: store?._id,
    });
    await activity.save();
    res.status(200).send(store);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post(
  "/admin/send/delivery",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      await sendOrderDeliveryNotification();
      res.status(200).send();
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.delete(
  "/admin/request/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      RequestFile.findByIdAndDelete(id);
      res.status(200).send();
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.delete(
  "/admin/products/delete",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const deletedProducts = await Product.deleteMany();
      res.status(200).send(deletedProducts);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.delete(
  "/admin/product/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      // const order: IOrder | null = await Order.findOne({ productId: id });
      // if (order) return res.status(400).send({ message: 'Cant delete a product that has been ordered' })
      const product: IProduct | null = await Product.findById(id);
      await Review.deleteMany({ productId: id });
      await Rating.deleteMany({ productId: id });
      await Order.deleteMany({ productId: id });
      await Activity.deleteMany({ productId: id });
      await product?.delete();
      res.status(200).send(product);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.delete(
  "/admin/order/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const order = await Order.findByIdAndUpdate(id, { status: "cancelled" });
      const canceledOrder = await WalletEntry.findOneAndUpdate({ orderId: id }, { $set: { status: "CANCELLED" } });

      if (order) {
        const ownerId = order.sellerId;
        const cancelledAmount = canceledOrder?.amount;
        const cancelledPendingWallet = await Wallet.findOne({ ownerId: ownerId });
        const pendingPayout = Number(cancelledPendingWallet?.pendingPayout) - Number(cancelledAmount);

        const cancellerWallet = await Wallet.findOneAndUpdate({ ownerId: ownerId }, { $set: { pendingPayout: pendingPayout } });

        const newNotification = new Notification({
          to: new ObjectId(order.userId as unknown as mongoose.Types.ObjectId),
          from: order.sellerId,
          title: `Cancelled Order`,
          content: `Your order has been cancelled by successfully`,
          isRead: false
        })
        await newNotification.save()
        sendNotification(NOTIFICATION_TARGET.ADMIN, newNotification, order.userId.toString())
      }

      res.status(200).send(canceledOrder);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.get(
  "/admin/products/stat",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const products: IProduct[] = await Product.find({ active: true, publish: true, });
      res.status(200).send(products.length);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.patch(
  "/admin/delete/contact/:id",
  adminAuth,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    try {
      const contact: IContact | null = await Contact.findById(id);
      if (!contact) {
        return res.status(404).send("Not found");
      }
      contact!.active = !contact.active;
      await contact!.save();
      res.status(200).send();
    } catch (e) {
      res.status(500).send(e);
    }
  }
);

router.post(
  "/admin/reply/contact",
  adminAuth,
  async (req: Request, res: Response) => {
    try {
      const title = req.body.title
      const message = req.body.message
      const contact = await Contact.findById(req.body.contactId);
      if (!contact) return res.status(403).send("Don't reply to this contact");
      const replyContact = new ReplyContact({
        contactId: new ObjectId(req.body.contactId as unknown as mongoose.Types.ObjectId),
        title: title,
        message: message,
      });
      await replyContact.save();
      await replyAdminContact(contact.email, title, message);
      res.status(200).send(replyContact);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
export default router;
