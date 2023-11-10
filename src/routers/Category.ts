import express, { Request, Response, Router } from "express";
import Category, { ICategory } from "../Models/Category";
import cloudinary from "cloudinary";
import Product, { IProduct } from "../Models/Product";
import { ObjectId } from "mongodb";
import Store from "../Models/Store";
import Seller from "../Models/Seller";
import { getLastweek } from "../Helpers/TimeDiff";
import Order, { IOrder } from "../Models/Order";
import { logger } from "../libs/helpers";

const router: Router = express.Router();
cloudinary.v2.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPI,
  api_secret: process.env.CLOUDSECRET,
});
router.post("/category", async (req: Request, res: Response) => {
  try {
    const category: ICategory = new Category(req.body);
    await category.save();
    res.status(201).send(category);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.patch("/category/:id", async (req: Request, res: Response) => {
  try {
    const _id = req.params.id;
    const updates: string[] = Object.keys(req.body);
    const allowedUpdates: string[] = ["subcategories", "title", "link"];
    const isAllowed: boolean = updates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isAllowed) return res.status(400).send({ message: "Invalid Update" });

    const category: ICategory | null = await Category.findById(_id);
    if (!category)
      return res.status(400).send({ message: "Category does not exist" });

    updates.forEach((update) => ((category as any)[update] = req.body[update]));
    await category.save();
    res.status(200).send(category);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/categories", async (req: Request, res: Response) => {
  try {
    const categories = await Category.find({}).sort({ title: 1 });
    res.status(200).send(categories);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/topcategory", async (req: Request, res: Response) => {
  const lastWeek: Date = getLastweek(7);
  let productPlaceholder: IProduct[] = [];
  try {
    //qurery
    const query = {
      createdAt: { $gte: lastWeek },
    };
    // Grouping pipeline
    const groupingPipeline = [
      {
        $match: query,
      },

      {
        $group: {
          _id: "$productId",
          totalQuantity: { $sum: "$quantity" },
          totalPrice: { $sum: "$price" },
        },
      },

      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: "$category",
      },
      {
        $project: {
          _id: 0,
          category: 1,
          totalQuantity: 1,
        },
      },
    ];

    const ordersForTheWeek = await Order.aggregate(groupingPipeline);

    ordersForTheWeek.sort((a, b) => b.totalQuantity - a.totalQuantity);
    const top5Categories: any = [];
    for (const orders of ordersForTheWeek) {
      const categoryExist = top5Categories.find(
        (cat: any) =>
          cat.category._id.toString() === orders.category._id.toString()
      );

      if (!categoryExist && top5Categories.length < 5) {
        top5Categories.push(orders);
      }
    }
    res.status(200).send(top5Categories);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/categories", async (req: Request, res: Response) => {
  try {
    const category: ICategory[] = await Category.find({});

    res.status(200).send(category);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/topcategory", async (req: Request, res: Response) => {
  const lastWeek: Date = getLastweek(7);
  let productPlaceholder: IProduct[] = [];
  try {
    const products: IProduct[] = await Product.find({
      createdAt: {
        $gte: lastWeek,
        $lte: Date.now(),
      },
      orders: {
        $gt: 1,
      },
    })
      .populate({
        path: "category",
        model: Category,
      })
      .sort({
        orders: -1,
      })
      .limit(20);
    let productLength = products.length;
    for (productLength; productLength--; ) {
      if (products[productLength].orders > 0) {
        const isExisting: IProduct | undefined = productPlaceholder.find(
          (x) => x.category?._id === products[productLength].category?._id
        );
        if (isExisting) continue;
        productPlaceholder.push(products[productLength]);
      }
    }
    res.status(200).send(productPlaceholder);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/category/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const category: ICategory | null = await Category.findById(id);
    const cat_id = new ObjectId(id);
    const products = await Product.find({ category: cat_id, active: true, publish: true, quantity:{$gt: 0} })
      .populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      })
      .populate("ratingId");
    if (!category) {
      return res.status(404).send();
    }

    res.status(200).send({ category, products });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/category/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await Category.findByIdAndDelete(id);
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});
export default router;
