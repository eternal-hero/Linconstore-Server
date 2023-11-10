import mongoose from "mongoose";
import ChatRoom from "../Models/ChatRoom"
import { CHATROOM_STATUS, CHAT_TYPE } from "../socket/types"
import User from "../Models/User";
import Product from "../Models/Product";
import Message from "../Models/Message";
import Seller from "../Models/Seller";



const createNewChatRoom = async (chatRoom: any) => {
    const existingRoom = await ChatRoom.findOne({ roomName: chatRoom.roomName, status: CHATROOM_STATUS.OPENED })
    if(existingRoom) {
        const result = { room: existingRoom, status: 'existing' }
        return result
    } else {
        const newChatRoom = new ChatRoom(chatRoom);
        await newChatRoom.save();
        const result = { room: newChatRoom, status: 'new' }
        return result
    }
}

const getChatRoom = async (buyerId: any, sellerId: any, isAdminLoggedIn: any) => {
    if(isAdminLoggedIn === 'true') {
        
        const chatRooms = await ChatRoom.find({ status: CHATROOM_STATUS.OPENED, isAdminJoined: true});
        return chatRooms
    } else {
        if(sellerId !== 'null') {
            const normalChat_buyer = await ChatRoom.aggregate([
                {
                  $match: {
                    status: CHATROOM_STATUS.OPENED,
                    type: CHAT_TYPE.NORMAL_CHAT,
                    buyerId: new mongoose.Types.ObjectId(buyerId),
                  },
                },
                {
                  $lookup: {
                    from: 'users', // Replace with your actual collection name for users
                    localField: 'buyerId',
                    foreignField: '_id',
                    as: 'buyerDetails', // Alias for the joined buyer document
                  },
                },
                {
                  $lookup: {
                    from: 'products', // Replace with your actual collection name for products
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails', // Alias for the joined product document
                  },
                },
                {
                  $project: {
                    buyerId: 1, 
                    roomName: 1, // Include roomName
                    type: 1, // Include type
                    isAdminJoined: 1, // Include isAdminJoined
                    status: 1,
                    sellerId:1,
                    createdAt:1,
                    updatedAt:1,// Include the original buyerId field
                    buyerDetails: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: '$buyerDetails',
                            as: 'buyer',
                            in: {
                              _id: '$$buyer._id',
                              firstName: '$$buyer.firstName',
                              lastName: '$$buyer.lastName',
                            },
                          },
                        },
                        0,
                      ],
                    },
                    productId: 1, // Include the original productId field
                    productDetails: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: '$productDetails',
                            as: 'product',
                            in: {
                              _id: '$$product._id',
                              title: '$$product.title',
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
                {
                  $sort: {
                    createdAt: -1, // Sort in descending order
                  },
                },
            ]);              
              
            // `normalChat_buyer` now contains the desired structure
            const normalChat_seller = await ChatRoom.aggregate([
                {
                  $match: {
                    status: CHATROOM_STATUS.OPENED,
                    type: CHAT_TYPE.NORMAL_CHAT,
                    sellerId: new mongoose.Types.ObjectId(sellerId),
                  },
                },
                {
                    $lookup: {
                      from: 'users', // Replace with your actual collection name for users
                      localField: 'buyerId',
                      foreignField: '_id',
                      as: 'buyerDetails', // Alias for the joined buyer document
                    },
                },
                {
                  $lookup: {
                    from: 'products', // Replace with your actual collection name for products
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails', // Alias for the joined product document
                  },
                },
                {
                  $project: {
                    productId: 1,
                    roomName: 1, // Include roomName
                    type: 1, // Include type
                    isAdminJoined: 1, // Include isAdminJoined
                    status: 1,
                    sellerId:1,
                    buyerId:1,
                    createdAt:1,
                    updatedAt:1, // Include the original productId field
                    buyerDetails: {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: '$buyerDetails',
                              as: 'buyer',
                              in: {
                                _id: '$$buyer._id',
                                firstName: '$$buyer.firstName',
                                lastName: '$$buyer.lastName',
                              },
                            },
                          },
                          0,
                        ],
                      },
                    productDetails: {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: '$productDetails',
                              as: 'product',
                              in: {
                                _id: '$$product._id',
                                title: '$$product.title',
                              },
                            },
                          },
                          0,
                        ],
                      },
                  },
                },
                {
                  $sort: {
                    createdAt: -1, // Sort in descending order
                  },
                },
            ]);

            // `refundChat_seller` now contains the desired structure
            const refundChat = await ChatRoom.aggregate([
                {
                  $match: {
                    status: CHATROOM_STATUS.OPENED,
                    type: CHAT_TYPE.REFUND_CHAT,
                    sellerId: new mongoose.Types.ObjectId(sellerId),
                  },
                },
                {
                    $lookup: {
                      from: 'users', // Replace with your actual collection name for users
                      localField: 'buyerId',
                      foreignField: '_id',
                      as: 'buyerDetails', // Alias for the joined buyer document
                    },
                },
                {
                  $lookup: {
                    from: 'products', // Replace with your actual collection name for products
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'productDetails', // Alias for the joined product document
                  },
                },
                {
                  $project: {
                    productId: 1,
                    roomName: 1, // Include roomName
                    type: 1, // Include type
                    isAdminJoined: 1, // Include isAdminJoined
                    status: 1,
                    sellerId:1,
                    createdAt:1,
                    buyerId:1,
                    updatedAt:1, // Include the original productId field
                    buyerDetails: {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: '$buyerDetails',
                              as: 'buyer',
                              in: {
                                _id: '$$buyer._id',
                                firstName: '$$buyer.firstName',
                                lastName: '$$buyer.lastName',
                              },
                            },
                          },
                          0,
                        ],
                    },
                    productDetails: {
                        $arrayElemAt: [
                          {
                            $map: {
                              input: '$productDetails',
                              as: 'product',
                              in: {
                                _id: '$$product._id',
                                title: '$$product.title',
                              },
                            },
                          },
                          0,
                        ],
                      },
                  },
                },
                {
                  $sort: {
                    createdAt: -1, // Sort in descending order
                  },
                },
            ]);
            return [...normalChat_buyer, ...normalChat_seller, ...refundChat]
        } else {
            const chatRooms = await ChatRoom.find({ status: CHATROOM_STATUS.OPENED, buyerId: new mongoose.Types.ObjectId(buyerId) });
            return chatRooms
        }
    }
}

const getSellerChatRoom = async (sellerId: any) => {
          const normalChat_seller = await ChatRoom.aggregate([
              {
                $match: {
                  status: CHATROOM_STATUS.OPENED,
                  type: CHAT_TYPE.NORMAL_CHAT,
                  sellerId: new mongoose.Types.ObjectId(sellerId),
                  deletedBySellerId: { $ne: sellerId }
                },
              },
              {
                  $lookup: {
                    from: 'users', // Replace with your actual collection name for users
                    localField: 'buyerId',
                    foreignField: '_id',
                    as: 'buyerDetails', // Alias for the joined buyer document
                  },
              },
              {
                $lookup: {
                  from: 'products', // Replace with your actual collection name for products
                  localField: 'productId',
                  foreignField: '_id',
                  as: 'productDetails', // Alias for the joined product document
                },
              },
              {
                $project: {
                  productId: 1,
                  roomName: 1, // Include roomName
                  type: 1, // Include type
                  isAdminJoined: 1, // Include isAdminJoined
                  status: 1,
                  sellerId:1,
                  buyerId:1,
                  createdAt:1,
                  updatedAt:1, // Include the original productId field
                  buyerDetails: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: '$buyerDetails',
                            as: 'buyer',
                            in: {
                              _id: '$$buyer._id',
                              firstName: '$$buyer.firstName',
                              lastName: '$$buyer.lastName',
                            },
                          },
                        },
                        0,
                      ],
                    },
                  productDetails: {
                      $arrayElemAt: [
                        {
                          $map: {
                            input: '$productDetails',
                            as: 'product',
                            in: {
                              _id: '$$product._id',
                              title: '$$product.title',
                            },
                          },
                        },
                        0,
                      ],
                    },
                },
              },
              {
                $sort: {
                  createdAt: -1, // Sort in descending order
                },
              },
          ]);
          return [...normalChat_seller] 
}
 
const getBuyerChatRoom = async (buyerId: any) => {
  const normalChat_buyer = await ChatRoom.aggregate([
      {
        $match: {
          status: CHATROOM_STATUS.OPENED,
          type: CHAT_TYPE.NORMAL_CHAT,
          buyerId: new mongoose.Types.ObjectId(buyerId),
          deletedByBuyerId: { $ne: buyerId }
        },
      },
      {
        $lookup: {
          from: 'users',   
          localField: 'buyerId',
          foreignField: '_id',
          as: 'buyerDetails', 
        },
      },
      {
        $lookup: {
          from: 'products', 
          localField: 'productId',
          foreignField: '_id',
          as: 'productDetails', 
        },
      },
      {
        $project: {
          buyerId: 1, 
          roomName: 1, // Include roomName
          type: 1, // Include type
          isAdminJoined: 1, 
          status: 1,
          sellerId:1,
          createdAt:1,
          updatedAt:1,
          buyerDetails: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$buyerDetails',
                  as: 'buyer',
                  in: {
                    _id: '$$buyer._id',
                    firstName: '$$buyer.firstName',
                    lastName: '$$buyer.lastName',
                  },
                },
              },
              0,
            ],
          },
          productId: 1,
          productDetails: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$productDetails',
                  as: 'product',
                  in: {
                    _id: '$$product._id',
                    title: '$$product.title',
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort in descending order
        },
      },
  ]);
  for(let i = 0; i < normalChat_buyer.length; i++) {
    const sellerDetails:any = await Seller.findOne({ _id: normalChat_buyer[i].sellerId })
    .populate({
      path: 'owner',
      select: '_id firstName lastName',
    })
    .select('_id owner');
    if(sellerDetails) {
      const formattedResponse = {
        sellerId: sellerDetails._id, // Renaming _id to sellerId
        owner: {
          _id: sellerDetails?.owner?._id,
          firstName: sellerDetails?.owner?.firstName,
          lastName: sellerDetails?.owner?.lastName,
        },
      };
      Object.assign(normalChat_buyer[i],{sellerDetails:formattedResponse})
    }
    }          
  return [...normalChat_buyer]
} 

const getBuyerChatRoomForAdmin = async (roomName:any) => {
  const adminChat_buyer = await Message.find({
    status: CHATROOM_STATUS.OPENED,
    type: CHAT_TYPE.ADMIN_CHAT,
    deletedByRole: null,
    roomName
  })       
  return [...adminChat_buyer]
} 

const getAdminChatRoom = async () => {
  const adminChat_admin = await ChatRoom.aggregate([
      {
        $match: {
          status: CHATROOM_STATUS.OPENED,
          type: CHAT_TYPE.ADMIN_CHAT,
          deletedByRole: {$ne : "admin"}
        },
      },
      {
        $lookup: {
          from: 'users',   
          localField: 'buyerId',
          foreignField: '_id',
          as: 'buyerDetails', 
        },
      },
      {
        $project: {
          buyerId: 1, 
          roomName: 1, // Include roomName
          type: 1, // Include type
          isAdminJoined: 1, 
          status: 1,
          createdAt:1,
          updatedAt:1,
          buyerDetails: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$buyerDetails',
                  as: 'buyer',
                  in: {
                    _id: '$$buyer._id',
                    firstName: '$$buyer.firstName',
                    lastName: '$$buyer.lastName',
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          createdAt: -1, // Sort in descending order
        },
      },
  ]);       
  return [...adminChat_admin]
} 


const deleteChatRoom = async (id:any,user_id:any,role:any) => {
    let room;
      if(role == 'user') {
        room = await ChatRoom.updateOne({
          roomName: id
        },{ $set: {deletedByBuyerId:user_id,deletedByRole:role}}).exec();
        await Message.updateMany({
          roomName:id
        },{ $set: {deletedByBuyerId:user_id,deletedByRole:role}}).exec()
      } else if(role == 'seller') {
        room = await ChatRoom.updateOne({
          roomName: id
        },{ $set: {deletedBySellerId:user_id,deletedByRole:role}}).exec();
        await Message.updateMany({
          roomName:id
        },{ $set: {deletedBySellerId:user_id,deletedByRole:role}}).exec()
      } else {
        room = await ChatRoom.updateOne({
          roomName: id
        },{ $set: {deletedByRole:role}}).exec();
        await Message.updateMany({
          roomName:id
        },{ $set: {deletedByRole:role}}).exec()
      }

      const existingRoom:any = await ChatRoom.findOne({roomName:id})
      if(existingRoom.deletedBySellerId != null && existingRoom.deletedByBuyerId != null) {
        await Message.deleteMany({roomName:id})
        room = await ChatRoom.deleteOne({roomName:id})
      } 
    
  return room
}

const deleteAdminChatRoom = async (id:any,role:any) => {
  let room = await ChatRoom.updateOne({
        roomName: id
      },{ $set: {deletedByRole:role}}).exec();
      await Message.updateMany({
        roomName:id
      },{ $set: {deletedByRole:role}}).exec()
  
    return room
}


const closeChatRoom = async (roomName: string) => {
    let existingChatRoom = await ChatRoom.findOne({ roomName, status: CHATROOM_STATUS.OPENED });
    if(existingChatRoom) {
        existingChatRoom.status = CHATROOM_STATUS.CLOSED;
        existingChatRoom.save();
        return {status: 200, chatRoom: existingChatRoom}
    } else {
        return {status: 404, chatRoom: null}
    }
}
export const chatRoomService = {
    createNewChatRoom,
    getChatRoom,
    closeChatRoom,
    getBuyerChatRoom,
    getSellerChatRoom,
    deleteChatRoom,
    getBuyerChatRoomForAdmin,
    getAdminChatRoom,
    deleteAdminChatRoom
}