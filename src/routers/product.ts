import express, { Request, Response, Router } from "express";
import Product, { IProduct } from "../Models/Product";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import Category from "../Models/Category";
import Store, { IStore } from "../Models/Store";
import { sellerAuth } from "../Middleware/auth";
import Seller from "../Models/Seller";
import Review from "../Models/Review";
import Ads, { Iads } from "../Models/Ads";
import Rating from "../Models/Rating";

const router: Router = express.Router();
router.get("/product/:id", async (req: Request, res: Response) => {
  const id = req.params;
  try {
    const product = await Product.findById(
      new ObjectId(id as unknown as mongoose.Types.ObjectId)
    ).populate({
      path: "owner",
      model: Store,
      populate: {
        path: "owner",
        model: Seller,
      },
    });
    if (!product) {
      return res.status(404).send();
    }

    const mProducts = await Product.find({
      active: true,
      publish: true,
      _id: { $ne: product._id },
      owner: product.owner,
      createdAt: { $lt: new Date(product.createdAt) }
    })
      .sort({ createdAt: "desc" })
      .populate([{
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
      },])
      .limit(3);

    const sProducts: IProduct[] = await Product.find({
      active: true,
      publish: true,
      subcategory: product.subcategory,
      _id: { $ne: product._id },
      createdAt: { $lt: new Date(product.createdAt) }
    })
      .sort({ createdAt: "desc" })
      .populate("ratingId")
      .populate([{
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
      },])
      .limit(3);

    const aProducts: Iads[] = await Ads.find({ productId: { $ne: product._id } })
      .sort({ createdAt: "desc" })
      .populate({
        path: "productId",
        model: Product,
        match: {
          active: true,
          publish: true,
          category: product.category,
          createdAt: { $lt: new Date(product.createdAt) }
        },
        populate: [
          {
            path: "ratingId",
            model: Rating,
          },
          {
            path: "owner",
            model: Store,
            populate: {
              path: "owner",
              model: Seller,
            },
          },
        ],
      });

    let ttt = aProducts.filter((ad) => ad.productId)
    res.status(200).send({ product, mProducts, sProducts, aProducts: ttt });
  } catch (e) {
    console.log(e);
    res.status(401).send(e);
  }
});
router.get("/store/product", async (req: Request, res: Response) => {
  const { name } = req.query;
  try {
    const store = await Store.findOne({ name });
    if (!store) {
      return res.status(402).send("Not found");
    }
    const products = await Product.find({ owner: store!.owner, active: true, publish: true, });
    res.status(200).send(products);
  } catch (e) {
    res.status(402).send(e);
  }
});

router.patch(
  "/product/:id",
  sellerAuth,
  async (req: Request, res: Response) => {
    let data = req.body;
    if (req.body.category) {
      const category = await Category.findOne({ title: req.body.category });
      data.category = category!._id
    }
    const updates: string[] = Object.keys(req.body);
    const existingUpdate: string[] = [
      "tags",
      "photo",
      "title",
      "description",
      "category",
      "subcategory",
      "instruction",
      "global",
      "shipping",
      "variants",
      "weight",
      "quantity",
      "care",
      "shippingDetails",
      "price",
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
      const store: IStore | null = await Store.findOne({
        owner: req.seller._id,
      });
      if (!store) return res.status(404).send("Store does not exist");
      const product: IProduct | null = await Product.findOne({
        owner: store._id,
        _id,
      });
      if (!product) {
        return res.status(401).send("Product does not exist");
      }
      const isPrice = updates.includes("price");
      const price: number = req.body.price;
      if (isPrice && price < product.price) {
        const oldPrice: number = product.price;
        const priceDiff: number = oldPrice - price;
        product.discount = Number(((priceDiff / oldPrice) * 100).toFixed(0));
        const date = new Date();
        product.hot = true;
        product.productUpdatedDate = date;
      }
      // const uploader  = async (path : string) => await cloudinary.v2.uploader.upload(path)
      // const index1 = updates.indexOf('photo')
      // if (isPhoto) {
      //     const photo : string[] = [];
      //     const images: string [] = req.body.photo
      //     for (const image of images) {
      //         const response : cloudinary.UploadApiResponse = await uploader(image)
      //         photo.push(response.secure_url)
      //     }
      //     updates.forEach((update, index) => index !== index1 ? (product as any)[update] : product!.photo = index !== index1 ? req.body[update] : photo);
      //     await product!.save()
      //     return     res.status(200).send(product)
      // }
      updates.forEach(
        (update) => ((product as any)[update] = data[update])
      );
      await product.save();
      res.status(200).send(product);
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  }
);

router.get("/hotdeals", async (req: Request, res: Response) => {
  try {
    const hotdeals: IProduct[] = await Product.find({
      hot: true,
      active: true,
      publish: true,
      quantity: { $ne: 0 },
    })
      .populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      })
      .populate("ratingId")
      .sort({ createdAt: "desc" });
    res.status(200).send(hotdeals);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.get("/search/product", async (req: Request, res: Response) => {
  const term = req.query.term;
  const id = req.query.id;
  const tag = req.query.tag;
  try {
    const ads: Iads[] = await Ads.find({
      title: { $regex: term, $options: "i" },
    })
      .populate({
        path: "productId",
        model: Product,
        match: {
          active: true,
          publish: true,
          ...(id ? { category: new ObjectId(id as any) } : {}),
          ...(tag ? { tags: { $in: tag } } : {}),
        },
        populate: [
          {
            path: "ratingId",
            model: Rating,
          },
          {
            path: "owner",
            model: Store,
            populate: {
              path: "owner",
              model: Seller,
            },
          },
        ],
      })
      .limit(5);
    const products: IProduct[] = await Product.find({
      title: { $regex: term, $options: "i" },
      active: true,
      publish: true,
      ...(id ? { category: new ObjectId(id as any) } : {}),
      ...(tag ? { tags: { $in: tag } } : {}),
    })
      .populate("ratingId")
      .populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      });
    const relatedProduct: IProduct[] = await Product.find({
      active: true,
      publish: true,
      ...(id ? { category: new ObjectId(id as any) } : {}),
      ...(tag ? { tags: { $in: tag } } : {}),
    })
      .populate("ratingId")
      .populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      });

    const relatedItem = [];
    for (const related of relatedProduct) {
      const { tags } = related;
      const termVarialbe = term as string;
      if (tags?.includes(termVarialbe.toLowerCase())) {
        relatedItem.push(related);
      }
    }
    res.status(200).send({ products, relatedItem, ads });
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});
router.get("/product", async (req: Request, res: Response) => {
  const query = req.query;
  const sort: boolean = (query as unknown as string) === "new";
  try {
    const product: IProduct[] = await Product.find({ active: true, publish: true, })
      .sort("desc")
      .limit(sort ? 8 : 100);
    res.status(200).send(product);
  } catch (e) {
    res.status(401).send(e);
  }
});
router.get("/brands/products", async (req: Request, res: Response) => {
  try {
    const products = await Product.find({ active: true, publish: true, })
      .populate({
        path: "owner",
        model: Store,
        match: {
          account: "business",
        },
      })
      .exec();
    res.status(200).send(products);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/topProducts", async (req: Request, res: Response) => {
  try {
    const products: IProduct[] = await Product.find({ active: true, publish: true, })
      .sort({ orders: -1 })
      .populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      })
      .populate("ratingId")
      .sort({ createdAt: "desc" })
      .limit(12);
    res.status(200).send(products);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/products", async (req: Request, res: Response) => {
  try {
    const productsFind: IProduct[] = await Product.find({ active: true, publish: true, })
      .where("quantity")
      .gt(0)
      .populate({
        path: "owner",
        model: Store,
        populate: {
          path: "owner",
          model: Seller,
        },
      })
      .populate("ratingId")
      .sort({ createdAt: "desc" })
      .limit(12);
    // let products : IProduct[] = [];
    // let i = productsFind.length
    // for (i; i--;){
    //     if (productsFind[i].ratingId){
    //         const product : IProduct  =  await productsFind[i].populate('ratingId');
    //         products.push(product)
    //     }else {
    //         products.push(productsFind[i])
    //     }
    // }
    res.status(200).send(productsFind);
  } catch (e) {
    res.status(500).send(e);
  }
});
router.get("/product/reviews/:id", async (req: Request, res: Response) => {
  const id = req.params;
  try {
    const review = await Rating.find({
      productId: new ObjectId(id as unknown as mongoose.Types.ObjectId),
    });
    res.status(200).send(review);
  } catch (e) {
    res.status(500).send(e);
  }
});
export default router;
