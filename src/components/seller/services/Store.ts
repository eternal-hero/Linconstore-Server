import { IFilterSeller, IFilterStore, ISeller, IStore } from "../interface";
import { logger } from "../../../libs/helpers";
import { NotFoundError } from "../../../libs/helpers/errors";
import { Types } from "mongoose";
import Seller from "../../../Models/Seller";
import Store from "../../../Models/Store";
import { IId, IUpdateStore } from "../interface/store";

export class StoreServices {
  static async getUserStore(userId: Types.ObjectId): Promise<IStore> {
    const { _id: sellerId } = await this._readSeller({ owner: userId });

    logger.info(`Seller Id ${sellerId}`);
    return await this._readStore({ owner: sellerId });
  }

  static async updateStore(payload: IUpdateStore) {
    logger.info(`update store payload ${JSON.stringify(payload)}`);
    const store = await this._getUserStore({ id: payload.userId });

    logger.info(`store id ${JSON.stringify(store)}`);

    const updatedStore = await Store.updateOne(
      { _id: store._id },
      {
        sellGlobal:
          payload.sellGlobal !== undefined
            ? payload.sellGlobal
            : store.sellGlobal,
        disableChat:
          payload.disableChat !== undefined
            ? payload.disableChat
            : store.disableChat,
        domesticShipping: {
          express: payload?.domesticShipping || store.domesticShipping.express,
          standard:
            payload?.domesticShipping || store.domesticShipping.standard,
        },
      },
      { new: true }
    );

    logger.info(`updated store response ${JSON.stringify(updatedStore)}`);

    return updatedStore;
  }

  private static async _readSeller(query: IFilterSeller): Promise<ISeller> {
    const seller = await Seller.findOne(query);

    if (!seller) throw new NotFoundError("Seller not found");

    return seller;
  }

  private static async _readStore(query: IFilterStore): Promise<IStore> {
    const store = await Store.findOne(query).populate({ path: "owner", model: Seller, });

    if (!store) throw new NotFoundError("Store not found");

    return store;
  }

  static async _getUserStore(userId: IId): Promise<IStore> {
    const { _id: sellerId } = await this._readSeller({ owner: userId.id });

    logger.info(`Seller Id ${sellerId}`);
    return await this._readStore({ owner: sellerId });
  }
}
