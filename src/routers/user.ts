import express, { Request, Response } from "express";
import User, { Iuser } from "../Models/User";
import Feedback, { IFeedback } from "../Models/Feedback";
import mongoose from "mongoose";
import {
  addToOrders,
  capitalizeFirstLetter,
  createPaymentCheckout,
  findIfEmailExist,
  findIfEmailExistAndIsVerified,
  getProductRange,
  unCapitalizeFirstLetter,
  updateUserCart,
  validateUser,
} from "../Helpers/helpers";
import Review from "../Models/Review";
import {
  closeAccount,
  forgotPassword,
  sendExperience,
  verifyEmail,
} from "../Helpers/verifyUser";
import { auth } from "../Middleware/auth";
import { generateOtp } from "../Helpers/generateOtp";
import { ObjectId } from "mongodb";
import Order, { IOrder } from "../Models/Order";
import Product, { IProduct } from "../Models/Product";
import Cart, { ICart } from "../Models/Cart";
import Refund from "../Models/Refund";
import Contact from "../Models/Contact";
import Rating, { IRating } from "../Models/Rating";
import Store, { IStore } from "../Models/Store";
import Notification, { INotification } from "../Models/Notication";
import Message from "../Models/Message";
import { stripe } from "../app";
import Address, { IAddress } from "../Models/Address";
import jwt from "jsonwebtoken";
import Wish, { IWish } from "../Models/Wish";
import Stripe from "stripe";
import Seller, { Iseller } from "../Models/Seller";
import Close from "../Models/Close";
import { getLastweek } from "../Helpers/TimeDiff";
import { CHAT_TYPE, USER_ROLE } from "../socket/types";
import { IRate, handleRateChange } from "../Helpers/currencyRate";
import { request } from "http";
const router = express.Router();
// interface Iuser {
//     email : string,
//     password: string,
//     role : string,
// }

router.post("/user", async (req: Request, res: Response) => {
  const otp = generateOtp();
  try {
    const customer = await stripe.customers.create({
      email: req.body.email,
    });
    const customer_id = customer.id;
    const user = new User({ ...req.body, otp, customer_id });
    await user.save();
    await verifyEmail(req.body.phone, req.body.email, otp);
    res.status(201).send({ user });
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/user/:id", auth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user = await User.findByIdAndDelete(id);
    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

router.get("/user/follow/:id", auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const sellerId = req.params.id;
    const user = await User.findOne({ _id: userId });
    if (!user) return res.status(400).send("Invalid user");
    const seller = await Seller.findOne({ _id: sellerId });
    if (!seller) return res.status(400).send("Invalid seller ");

    const followerExist: number = seller.followers.indexOf(userId.toString());
    const followingExist: number = user.following.indexOf(sellerId.toString());
    let message;
    if (followerExist !== -1) {
      seller.followers.splice(followerExist, 1);
      user.following.splice(followingExist, 1);
      message = "Unfollowed";
    } else {
      seller.followers.push(userId.toString());
      user.following.push(sellerId);
      message = "Followed";
    }

    await seller.save();
    await user.save();

    res.status(200).send({ message, following: user.following });
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/user/phone", auth, async (req: Request, res: Response) => {
  const { phone } = req.body;
  try {
    req.user.phone = phone;
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/user/verify", async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  try {
    const existingUser = await findIfEmailExist(email);
    if (!existingUser) {
      return res.status(401).send("User does not exist");
    }
    const user = await validateUser(parseInt(otp), existingUser._id);
    if (user) {
      const token = await user.generateAuthToken();
      return res.status(200).send({ user, token });
    }
    res.status(401).send("Something went wrong");
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});
router.get("/users/fetch/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const users = await User.findByIdAndDelete(id);
    res.status(200).send(users);
  } catch (e) { }
});

router.post('/user/security', auth, async (req: Request, res: Response) => {
  const { newPassword, oldPassword } = req.body;
  try {
    const user = await User.findByCredentials(req.user.email, oldPassword);
    user.password = newPassword;
    await user.save();
    res.status(200).send('ok')
  }
  catch (e) {
    res.status(500).send(e)
  }
});

router.post("/user/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user: Iuser = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    const seller: Iseller | null = await Seller.findOne({ owner: user._id });
    if (user.isClosed) return res.status(403).send("something went wrong");
    if (user && user.isVerified) {
      return res.status(200).send({ user, token, seller: seller ? seller.isVerified : null });
    }
    res.status(400).send("Something went wrong");
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/user/resend", async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    await findIfEmailExistAndIsVerified(email);
    res.status(200).send("Ok");
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

router.get("/user/ratings", async (req: Request, res: Response) => {
  try {
    const rating = await Rating.deleteMany();

    res.status(200).send(rating);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/user/deals", async (req: Request, res: Response) => {
  try {
    const lastweek: Date = getLastweek(7);
    const products: IProduct[] = await getProductRange(lastweek, Date.now());
    res.status(200).send(products);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/user/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedUser = await User.findByIdAndUpdate(id, { isVerified: false });

    res.status(200).send(deletedUser);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/user/reset", async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user: Iuser = await findIfEmailExist(email);
    if (!user.isVerified) return res.status(400).send();
    const otp = await jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    await forgotPassword(otp, user._id, email);
    res.status(200).send(user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/user/password", async (req: Request, res: Response) => {
  const { password, id } = req.body;
  try {
    const user = await User.findById(id);
    user!.password = password;
    await user!.save();
    res.status(200).send(user);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});
router.get("/user/reset/verify", async (req: Request, res: Response) => {
  const { otp, id } = req.query;
  try {
    const user: Iuser | null = await User.findById(id);
    if (!user) {
      return res.status(404).send();
    }
    const decoded = await jwt.verify(otp, process.env.JWT_SECRET);
    if (user._id.toHexString() === decoded._id) {
      return res.status(200).send();
    }
    res.status(404).send();
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/user/detail", async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    res.status(200).send(user);
  } catch (e) {
    console.log(e);
  }
});

router.get("/user/logout", auth, async (req: Request, res: Response) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token !== req.token
    );
    await req.user.save();
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/user/order", auth, async (req: Request, res: Response) => {
  const _id = req.body.productId;
  try {
    const product: IProduct | null = await Product.findOne({ _id });
    if (!product) {
      return res.status(400).send("Invalid Product");
    }
    product.quantity = product.quantity - parseInt(req.body.quantity);
    product.save();
    const order = new Order({
      ...req.body,
      sellerId: product!.owner,
      userId: req.user._id,
    });
    await order.save();
    res.status(200).send(order);
  } catch (e) {
    res.status(500).send(e);
  }
});
// get cart
router.get("/cart", auth, async (req: Request, res: Response) => {
  const owner = req.user._id;
  try {
    const cart: ICart | null = await Cart.findOne({ owner }).populate({
      path: "products",
      populate: [
        {
          path: "productId",
          model: Product,
          populate: [
            {
              path: "owner",
              model: Store,
            },
          ],
        },
      ],
    });
    if (cart && cart.products.length > 0) {
      return res.status(200).send(cart);
    }
    res.status(200).send("Empty cart");
  } catch (e) {
    res.status(500).send(e);
  }
});

//increment cart
router.post("/cart/increment", auth, async (req: Request, res: Response) => {
  const owner = req.user._id;
  const { productId } = req.body;
  try {
    await updateUserCart(owner, productId, true);
    res.status(200).send();
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});
//decrement cart
router.post("/cart/decrement", auth, async (req: Request, res: Response) => {
  const owner = req.user._id;
  const { productId } = req.body;
  try {
    await updateUserCart(owner, productId, false);
    res.status(200).send();
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});
//add items to cart

router.post("/cart", auth, async (req: Request, res: Response) => {
  const owner = req.user._id;
  const { productId, quantity, price, variants } = req.body;
  try {
    const cart: ICart | null = await Cart.findOne({ owner });
    const product: IProduct | null = await Product.findOne({
      _id: new ObjectId(productId),
    });
    if (!product) {
      return res.status(404).send("Product not found");
    }
    // const price : number = product.price;
    const title: string = product.title;
    const photo: string = product.photo[0];
    const productQuantity: number = product.quantity;
    if (cart) {
      const productIndex: number = cart.products.findIndex(
        (product) => product.productId.toHexString() === productId
      );
      if (productIndex > -1) {
        let product = cart.products[productIndex];
        if (product.quantity + parseInt(quantity) > productQuantity)
          return res.status(400).send("Product quantity exceeded");
        product.quantity += parseInt(quantity);
        cart.bill = cart.products.reduce(
          (acc, cur) => acc + cur.quantity * cur.price,
          0
        );
        cart.products[productIndex] = product;
        await cart.save();
        return res.status(200).send(cart);
      }
      cart.products.push({
        productId,
        quantity,
        name: title,
        price,
        photo,
        variants,
      });
      cart.bill = cart.products.reduce(
        (acc, cur) => acc + cur.quantity * cur.price,
        0
      );
      await cart.save();
      return res.status(200).send(cart);
    }
    //no cart exist for that user, create new one
    const newCart = new Cart({
      owner,
      products: [{ productId, name: title, quantity, price, photo, variants }],
      bill: quantity * price,
    });
    await newCart.save();
    res.status(201).send(newCart);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

//delete item in cart
router.delete("/cart", auth, async (req: Request, res: Response) => {
  const productId = req.query.id;
  const owner = req.user._id;
  try {
    let cart: ICart | null = await Cart.findOne({ owner });
    if (!cart) {
      return res.status(404).send("Product not found");
    }
    const productIndex: number = cart.products.findIndex(
      (product) => product.productId.toHexString() === productId
    );
    if (productIndex > -1) {
      let product = cart.products[productIndex];
      cart.bill -= product.quantity * product.price;
      if (cart.bill < 0) {
        cart.bill = 0;
      }
      cart.products.splice(productIndex, 1);
      cart.bill = cart.products.reduce(
        (acc, cur) => acc + cur.quantity * cur.price,
        0
      );
      await cart.save();
      return res.status(200).send(cart);
    }
    res.status(404).send("Product not Found");
  } catch (e) {
    res.status(400).send(e);
  }
});
router.post("/user/refund", auth, async (req: Request, res: Response) => {
  const _id: mongoose.Types.ObjectId = req.body.productId;
  try {
    const isVerified: IOrder | null = await Order.findOne({
      userId: req.user._id,
      productId: _id,
    });
    if (!isVerified) return res.status(404).send("Not Found");
    isVerified!.refund = true;
    await isVerified.save();
    const product: IProduct | null = await Product.findOne({ _id });
    const storeId: mongoose.Types.ObjectId | undefined = product?.owner;
    const refund = new Refund({
      ...req.body,
      storeId,
      userId: req.user._id,
    });
    await refund.save();
    res.status(200).send(refund);
  } catch (e) {
    res.status(400).send(e);
  }
});
router.get("/user/order", auth, async (req: Request, res: Response) => {
  const status = req.query.status;
  try {
    const order: IOrder[] = await Order.find({
      userId: req.user._id,
      status,
    }).populate([
      {
        path: "productId",
        model: Product,
        populate: [{
          path: "owner",
          model: Store,
          populate: {
            path: "owner",
            model: Seller,
          },
        }, {
          path: "ratingId",
          model: Rating,
        }],
      }, {
        path: "address",
        model: Address,
      }
    ]);
    res.status(200).send({ user: req.user._id, order });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/user/order/shipped", auth, async (req: Request, res: Response) => {
  try {
    const order: IOrder[] = await Order.find({ userId: req.user._id })
      .or([{ status: "shipped" }, { status: "delivered" }])
      .populate([{
        path: "productId",
        model: Product,
        populate: [{
          path: "owner",
          model: Store,
          populate: {
            path: "owner",
            model: Seller,
          },
        }, {
          path: "ratingId",
          model: Rating,
        }],
      }, {
        path: "address",
        model: Address,
      }
      ]);
    res.status(200).send({ user: req.user._id, order });
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/user/order/processed", auth, async (req: Request, res: Response) => {
  try {
    const order: IOrder[] = await Order.find({ userId: req.user._id })
      .or([{ status: "processed" }, { status: "cancelled" }])
      .populate([{
        path: "productId",
        model: Product,
        populate: [{
          path: "owner",
          model: Store,
          populate: {
            path: "owner",
            model: Seller,
          },
        }, {
          path: "ratingId",
          model: Rating,
        }],
      }, {
        path: "address",
        model: Address,
      }
      ]);
    res.status(200).send({ user: req.user._id, order });
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get(
  "/user/order/cancelled",
  auth,
  async (req: Request, res: Response) => {
    try {
      const order: IOrder[] = await Order.find({ userId: req.user._id })
        .or([{ status: "cancelled" }, { status: "processed" }])
        .populate([
          {
            path: "productId",
            model: Product,
            populate: {
              path: "owner",
              model: Store,
              populate: {
                path: "owner",
                model: Seller,
              },
            },
          }, {
            path: "address",
            model: Address,
          }
        ]);
      res.status(200).send({ user: req.user._id, order });
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.post("/user/contact", async (req: Request, res: Response) => {
  const contact = new Contact(req.body);
  try {
    await contact.save();
    res.status(200).send(contact);
  } catch (e) {
    res.status(500).send(e);
  }
});
type myData = {
  rating: number;
  productId: mongoose.Types.ObjectId;
};
type ratings = {
  userId: mongoose.Types.ObjectId;
  rating: number;
  name: string;
};
type newData = {
  productId: mongoose.Types.ObjectId;
  averageRating: number;
  ratings: ratings[];
};
router.post("/user/rate", auth, async (req: Request, res: Response) => {
  const data: myData = {
    rating: req.body.rating,
    productId: req.body.productId,
  };
  const name = req.user.firstName;
  const { comment, rating: rating1, productId } = req.body;
  try {
    const rating: IRating | null = await Rating.findOne({
      productId: new ObjectId(data.productId),
    });
    if (rating) {
      const existingUser = rating.ratings.find(
        (data) => data.userId.toHexString() === req.user._id.toHexString()
      );
      if (existingUser) {
        return res
          .status(401)
          .send({ status: "User cant rate the same item more than once" });
      }
      rating.ratings = rating.ratings.concat({
        rating: data.rating,
        name: req.user.email,
        userId: req.user._id,
        comment: req.body.comment,
      });
      const newRating: number = rating.ratings.reduce(
        (acc, obj) => acc + obj.rating,
        0
      );
      const length: number = rating.ratings.length;
      rating.averageRating = Number((newRating / length).toFixed(1));
      await rating.save();
      return res.status(200).send(rating);
    }
    const newData: newData = {
      productId: req.body.productId,
      ratings: [
        {
          userId: req.user._id,
          rating: req.body.rating,
          name,
        },
      ],
      averageRating: data.rating,
    };
    const newRating = new Rating(newData);
    await newRating.save();
    const product: IProduct | null = await Product.findById(req.body.productId);
    product!.ratingId = newRating._id;
    product!.save();
    const review = new Review({
      description: comment,
      rate: rating1,
      productId,
      name,
      owner: product?.owner,
    });
    await review.save();
    res.status(201).send(newRating);
  } catch (e) {
    console.log(e);
    res.status(401).send(e);
  }
});
// router.get('/user/rate', auth, async (req : Request, res : Response) => {
//     try {
//         const rating : IRating [] = await Rating.findOne({});
//         res.status(200).send(rating)
//     }
//     catch (e) {
//         res.status(500).send(e)
//     }
// })
router.get("/store/view/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    const store: IStore | null = await Store.findById(id);
    if (!store) {
      return res.status(404).send("Not Found");
    }
    store!.views = store!.views + 1;
    await store!.save();
    res.status(200).send(store);
  } catch (e) {
    res.status(500).send(e);
  }
});
// router.patch(
//   "/user/notification/read",
//   auth,
//   async (req: Request, res: Response) => {
//     try {
//       const notifications: INotication[] = await Notification.find({
//         user_to: req.user._id,
//       });
//       let notificationLength: number = notifications.length;
//       for (notificationLength; notificationLength--; ) {
//         if (notifications[notificationLength].isRead) continue;
//         notifications[notificationLength].isRead = true;
//         notifications[notificationLength].save();
//       }
//       res.status(200).send("ok");
//     } catch (e) {
//       res.status(500).send(e);
//     }
//   }
// );
router.get("/admin/messages/:id", async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const messages = await Message.find({
      roomName: id,
      deletedByRole: null
    }).exec();
    res.status(200).send(messages);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/admin/broadCast", async (req: Request, res: Response) => {
  try {
    const messages = await Notification.find({
      title: "Broadcast",
      senderRole: USER_ROLE.ADMIN,
      from: USER_ROLE.ADMIN,
    }).exec();
    res.status(200).send(messages);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/user/room/messages/:id", auth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { sellerId, role, buyerId } = req.query
    let messages = []
    if (role == 'user') {
      messages = await Message.find({
        $or: [
          { from: req.user._id },
          { to: req.user._id },
        ],
        roomName: id,
        deletedByBuyerId: { $ne: buyerId }
      }).exec();
    } else if (role == 'seller') {
      messages = await Message.find({
        $or: [
          { from: req.user._id },
          { to: req.user._id },
        ],
        roomName: id,
        deletedBySellerId: { $ne: sellerId }
      }).exec();
    } else {
      messages = await Message.find({
        type: CHAT_TYPE.ADMIN_CHAT,
        roomName: id,
        deletedByRole: null
      }).exec();
    }
    res.status(200).send(messages);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/user/bill/address", auth, async (req: Request, res: Response) => {
  const address = new Address({
    ...req.body,
    userId: req.user._id,
    type: "billing",
  });
  try {
    const defaultBill: IAddress | null = await Address.findOne({
      type: "billing",
    });
    if (defaultBill) {
      defaultBill.type = "shipping";
      defaultBill.save();
      await address.save();
      return res.status(201).send(address);
    }
    await address.save();
    res.status(201).send(address);
  } catch (e) {
    res.status(400).send(e);
  }
});
router.post("/user/address", auth, async (req: Request, res: Response) => {
  const updates: string[] = Object.keys(req.body);
  const isDefault = updates.includes("default");
  try {
    if (isDefault) {
      const defaultExist: IAddress | null = await Address.findOne({
        default: true,
      });
      if (defaultExist) {
        defaultExist.default = false;
        await defaultExist.save();
        const address: IAddress = new Address({
          ...req.body,
          userId: req.user._id,
          default: true,
        });
        await stripe.customers.update(req.user.customer_id, {
          address: {
            country: address.country,
            line1: address.address,
          },
          phone: address.phoneNumber,
          name: address.firstName + " " + address.lastName,
        });
        await address.save();
        return res.status(200).send(address);
      }
      const address: IAddress = new Address({
        ...req.body,
        userId: req.user._id,
        default: true,
      });
      await stripe.customers.update(req.user.customer_id, {
        address: {
          country: address.country,
          line1: address.address,
        },
        phone: address.phoneNumber,
        name: address.firstName + " " + address.lastName,
      });
      await address.save();
      return res.status(200).send(address);
    }
    const address: IAddress = new Address({
      ...req.body,
      userId: req.user._id,
    });
    await address.save();
    await stripe.customers.update(req.user.customer_id, {
      address: {
        country: address.country,
        line1: address.address,
      },
      phone: address.phoneNumber,
      name: address.firstName + " " + address.lastName,
    });
    res.status(200).send(address);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});
router.get("/user/address", auth, async (req: Request, res: Response) => {
  try {
    const address: IAddress[] = await Address.find({ userId: req.user._id });
    res.status(200).send(address);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch("/user/address/:id", auth, async (req: Request, res: Response) => {
  const updates: string[] = Object.keys(req.body);
  const { id } = req.params;
  const allowedUpdate = ["city", "country", "firstName", "lastName", "phoneNumber", "state", "zipCode", "address", "id"];
  const isAllowed: boolean = updates.every((update) => allowedUpdate.includes(update));
  try {
    if (!isAllowed) return res.status(403).send("Invalid updates");
    const existingAddress: IAddress | null = await Address.findById(id);
    updates.forEach(
      (update) => ((existingAddress as any)[update] = req.body[update])
    );
    await existingAddress!.save();
    res.status(200).send(existingAddress);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.delete(
  "/user/address/:id",
  auth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const newAddress = await Address.findByIdAndDelete(id);
      res.status(200).send(newAddress);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.patch(
  "/user/address/default/:id",
  auth,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const defaultExist: IAddress | null = await Address.findOne({
        default: true,
      });
      if (!defaultExist) {
        const newDefault = await Address.findByIdAndUpdate(id, {
          default: true,
        });
        return res.status(200).send(newDefault);
      }
      defaultExist.default = false;
      await defaultExist.save();
      const newDefault = await Address.findByIdAndUpdate(id, { default: true });
      return res.status(200).send(newDefault);
    } catch (e) {
      console.log(e);
      res.status(500).send(e);
    }
  }
);
router.get("/user/checkout", auth, async (req: Request, res: Response) => {
  try {
    //  await stripe.customers.createSource(req.user.customer_id, {
    //     source : req.body.token
    // });
    const cart: ICart | null = await Cart.findOne({
      owner: req.user._id,
    }).populate({
      path: "products",
      populate: [
        {
          path: "productId",
          model: Product,
          populate: [
            {
              path: "owner",
              model: Store,
              populate: [
                {
                  path: 'owner',
                  model: Seller
                }
              ]
            },
          ],
        },
      ],
    });
    // const createCharge = await stripe.charges.create({
    //     receipt_email: req.user.email,
    //     customer: req.user.customer_id,
    //     currency: 'usd',
    //     amount:    cart?.bill,
    //     source: token.id,
    // });
    // addToOrders(cart, req.user._id)
    // cart?.delete()
    res.status(200).send(cart);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/user/payment", auth, async (req: Request, res: Response) => {
  const shipping: number = req.body.shipping;
  console.log(shipping);
  const shippingType: string = req.body.type;
  const countryRate: number = req.body.countryRate;
  const currencyLabel: string = req.body.currencyLabel;
  try {
    const cart: ICart | null = await Cart.findOne({
      owner: req.user._id,
    }).populate({
      path: "products.productId",
      model: Product,
      populate: {
        path: "owner",
        model: Store,
      },
    });
    if (!cart) {
      return res.status(404).send("Nothing here");
    }

    const rates = (await handleRateChange()) as unknown as Record<string, number>;
    const customer = req.user.customer_id;
    const productsArray: {
      price_data: {
        currency: string;
        product_data: { name: string };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];
    const { products } = cart;

    products.forEach((product) => {
      const productObj = product.productId as unknown as IProduct;
      const owner = productObj.owner as unknown as IStore;
      const productConst = {
        price_data: {
          currency: currencyLabel,
          product_data: {
            name: product.name,
          },
          unit_amount: Math.floor(Number(product.price * rates[`${owner.currency}`] / countryRate) * 100),
        },
        quantity: product.quantity,
      };
      productsArray.push(productConst);
    });
    const shippingTotal = {
      price_data: {
        currency: currencyLabel,
        product_data: {
          name: "Shipping",
        },
        unit_amount: Math.floor(shipping * 100 / countryRate),
      },
      quantity: 1,
    };
    productsArray.push(shippingTotal);
    const session = await createPaymentCheckout(customer, productsArray);
    req.user.payId = session?.id as string;
    req.user.shipping = shippingType;
    await req.user.save();
    res.status(200).send(session);
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});
router.post(
  "/user/verify/payment",
  auth,
  async (req: Request, res: Response) => {
    try {
      const address = req.body.address;
      const donesticShipping = req.body.donesticShipping;
      const { payId: id, shipping } = req.user;
      const sessionDetails: Stripe.Response<Stripe.Checkout.Session> =
        await stripe.checkout.sessions.retrieve(id as string);
      if (!sessionDetails) {
        return res.status(404).send();
      }
      if (sessionDetails.payment_status === "unpaid") {
        return res.status(403).send("You have not paid yet");
      }
      const cart: ICart | null = await Cart.findOne({ owner: req.user._id }).populate({
      path: "products",
      populate: [
        {
          path: "productId",
          model: Product,
          populate: [
            {
              path: "owner",
              model: Store,
            },
          ],
        },
      ],
    });
      const orderData = await addToOrders(
        cart,
        req.user.email,
        req.user,
        address,
        shipping,
        donesticShipping
      );
      req.user.orders = req.user.orders + 1;
      req.user.payId = null;
      await req.user.save();
      cart?.delete();
      res.status(200).send(orderData);
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.post("/user/close", auth, async (req: Request, res: Response) => {
  const close = new Close(req.body);
  try {
    const seller: Iseller | null = await Seller.findOne({
      owner: req.user._id,
    });
    const store: IStore | null = await Store.findOne({ owner: seller?._id });
    if (store)
      return res
        .status(400)
        .send("You cant close this account as you already have a store");
    req.user.isClosed = true;
    await closeAccount(req.user.email);
    await req.user.save();
    await close.save();
    res.status(200).send("ok");
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});
router.get("/user", auth, async (req: Request, res: Response) => {
  try {
    res.status(200).send(req.user);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch("/user/modify", auth, async (req: Request, res: Response) => {
  const updates: string[] = Object.keys(req.body);
  const existingData: string[] = ["name", "phone", "password", "language", "currency"];
  const isAllowed: boolean = updates.every((update) =>
    existingData.includes(update)
  );
  if (!isAllowed) return res.status(403).send("Invalid updates");
  updates.forEach((update) => ((req.user as any)[update] = req.body[update]));
  try {
    await req.user.save();
    res.status(200).send(req.body);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/users", async (req: Request, res: Response) => {
  try {
    const users: Iuser[] = await User.find({});
    res.status(200).send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/user/wishlist", auth, async (req: Request, res: Response) => {
  try {
    const wishlists: IWish[] = await Wish.find({
      userId: req.user._id,
    }).populate({
      path: "productId",
      model: Product,
      populate: [{
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      },
      {
        path: "ratingId",
        model: Rating,
      },]
    });
    res.status(200).send(wishlists);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.post("/user/wishlist", auth, async (req: Request, res: Response) => {
  const wishlist = new Wish({ ...req.body, userId: req.user._id });
  const { productId } = req.body;
  try {
    let cart: ICart | null = await Cart.findOne({ owner: req.user._id });
    if (cart) {
      const productIndex: number = cart.products.findIndex(
        (product) => product.productId.toHexString() === productId
      );
      if (productIndex > -1) {
        let product = cart.products[productIndex];
        cart.bill -= product.quantity * product.price;
        if (cart.bill < 0) {
          cart.bill = 0;
        }
        cart.products.splice(productIndex, 1);
        cart.bill = cart.products.reduce(
          (acc, cur) => acc + cur.quantity * cur.price,
          0
        );
        await cart.save();
      }
    }
    const wishExists: IWish | null = await Wish.findOne({
      userId: req.user._id,
      productId,
    });
    if (wishExists) return res.status(401).send("item already exists");
    await wishlist.save();
    res.status(200).send(wishlist);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/wishlist", auth, async (req: Request, res: Response) => {
  const ids = req.query.ids;
  try {
    await Wish.deleteMany({ userId: req.user._id, _id: { $in: ids } });
    res.status(200).send("Ok");
  } catch (e) {
    res.status(500).send(e);
  }
});
router.delete("/wishlist/:id", auth, async (req: Request, res: Response) => {
  const id = req.params.id;
  try {
    await Wish.findByIdAndRemove(id);
    res.status(200).send("ok");
  } catch (e) {
    res.status(500).send(e);
  }
});

//this should work
router.get("/brands", async (req: Request, res: Response) => {
  try {
    const brands = await Store.find({
      $or: [{ account: "Brand" }],
    });
    res.status(200).send(brands);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/allusers", async (req: Request, res: Response) => {
  try {
    const users = await User.find({});
    res.status(200).send(users);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.delete("/users_test/:id", async (req: Request, res: Response) => {
  try {
    const _id = req.params.id;
    await User.findByIdAndDelete(_id);
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/allstores", async (req: Request, res: Response) => {
  try {
    const stores = await Store.find({
      $or: [{ account: "Individual Seller" }, { account: "Small Business" }],
    })
      .sort({ sales: -1 })
      .limit(4);
    res.status(200).send(stores);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/findstore", async (req: Request, res: Response) => {
  let { name, letterOrder, recentItem } = req.query;
  let sortParams = {};
  if (letterOrder) {
    sortParams = {
      title: letterOrder === "AZ" ? 1 : -1,
    };
  }
  if (recentItem) {
    sortParams = {
      createdAt: -1,
    };
  }
  if (!name) return res.status(400).send({ message: "store name is required" });
  const new_name = (name as string)!.split("-");
  if (new_name.length > 1) {
    name = new_name[0] + " " + new_name[1];
  } else {
    name = new_name[0];
  }

  try {
    let store: IStore | null = await Store.findOne({
      name: { $regex: new RegExp(name, "i") },
    });

    const seller = await Seller.findOne({ _id: store?.owner });
    const products: IProduct[] = await Product.find({
      owner: store?._id,
      active: true,
      publish: true,
    })
      .populate({
        path: "ratingId",
        model: Rating,
      })
      .populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      })
      .sort(sortParams);
    // @ts-ignore
    res.status(200).send({
      products,
      image: store?.logo,
      storeOwnerId: store?.owner,
      name: store?.name,
      description: store?.summary,
      followCount: seller?.followers.length,
    });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});
router.get(
  "/user/recommendation",
  auth,
  async (req: Request, res: Response) => {
    const user = req.user;
    try {
      const wishlist: IWish[] = await Wish.find({ userId: user._id }).populate({
        path: "productId",
        model: Product,
      });
      const products: IProduct[] = [];
      const stores: IStore[] = [];
      for (const wish of wishlist) {
        // @ts-ignore
        const category = wish.productId.category;
        const product = await Product.find({ category: category });
        // @ts-ignore
        const store = await Store.find({ owner: wish.productId.owner });
        products.concat(product);
        stores.concat(store);
      }
      res.status(200).send({ products, stores });
    } catch (e) {
      res.status(500).send(e);
    }
  }
);
router.post("/user/shopping", auth, async (req: Request, res: Response) => {
  const name = req.user.firstName + req.user.lastName;
  const { message } = req.body;
  try {

    const feedback = new Feedback({
      user: new ObjectId(req.user._id as unknown as mongoose.Types.ObjectId),
      message: message,
    });
    await feedback.save();
    await sendExperience(name, message);
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/user/store", auth, async (req: Request, res: Response) => {
  const userId = req.user._id;
  try {
    const seller = await Seller.findOne({ owner: userId });
    if (!seller) {
      return res.status(400).send({ message: "Seller not found" });
    }

    const store = await Store.findOne({ ownerId: seller._id });
    if (!store) {
      return res.status(400).send({ message: "Store not found" });
    }
    res.status(200).send(store);
  } catch (error) {
    res.status(500).send(error);
  }
});

export default router;
