import * as socketIo from "socket.io";
import http from "http";
import { ObjectId } from "mongodb";
import cloudinary from "cloudinary";
import {
  CHATROOM_STATUS,
  NOTIFICATION_TARGET,
  SOCKET_CHANNELS,
  USER_ROLE,
  USER_ROOM,
} from "./types";
import mongoose from "mongoose";
import Notification, { INotification } from "../Models/Notication";
import User, { Iuser } from "../Models/User";
import Message, { IMessage } from "../Models/Message";
import ChatRoom from "../Models/ChatRoom";

interface Isockets {
  socket: socketIo.Socket;
  userId: ObjectId;
  sellerId: ObjectId;
}

cloudinary.v2.config({
  cloud_name: process.env.CLOUDNAME,
  api_key: process.env.CLOUDAPI,
  api_secret: process.env.CLOUDSECRET,
});

let io: socketIo.Server;
let totalSockets: Isockets[] = [];
export const initializeSocket = (server: http.Server) => {
  io = new socketIo.Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket: socketIo.Socket) => {
    socket.on("disconnect", () => {
      const existingSocket = totalSockets.findIndex(
        (total) => total.socket === socket
      );
      if (existingSocket !== -1) {
        const deletedSocket = totalSockets.splice(existingSocket, 1)[0];
      }
    });

    socket.on(SOCKET_CHANNELS.JOIN, ({ userInfo, role }) => {
      switch (role) {
        case USER_ROLE.ADMIN:
          socket.join(USER_ROOM.ADMIN_ROOM);
          break;
        case USER_ROLE.SELLER:
          socket.data.userInfo = userInfo;
          totalSockets.unshift({
            socket,
            userId: new ObjectId(userInfo._id),
            sellerId: new ObjectId(userInfo._sellerId),
          });
          socket.join(USER_ROOM.SELLER_ROOM);
          break;
        case USER_ROLE.BUYER:
          socket.data.userInfo = userInfo;
          totalSockets.unshift({
            socket,
            userId: new ObjectId(userInfo._id),
            sellerId: new ObjectId(userInfo._sellerId),
          });
          socket.join(USER_ROOM.BUYER_ROOM);
          break;
        default:
          socket.data.userInfo = userInfo;
          totalSockets.unshift({
            socket,
            userId: new ObjectId(userInfo._id),
            sellerId: new ObjectId(userInfo._sellerId),
          });
          socket.join(USER_ROOM.BUYER_ROOM);
          break;
      }
    });

    socket.on(SOCKET_CHANNELS.JOIN_CHAT, (roomName) => {
      socket.join(roomName);
    });

    socket.on(SOCKET_CHANNELS.SEND_MESSAGE, async (message: IMessage) => {
      const newMessage = new Message(message);
      await newMessage.save();

      const chatRoom: any = await ChatRoom.findOne({ roomName: message.roomName })
      if (chatRoom?.deletedBySellerId == chatRoom.sellerId) {
        await ChatRoom.updateOne({
          roomName: message.roomName
        }, { $set: { deletedBySellerId: null, deletedByRole: null } })
      } else if (chatRoom?.deletedByBuyerId == chatRoom.buyerId) {
        await ChatRoom.updateOne({
          roomName: message.roomName
        }, { $set: { deletedByBuyerId: null, deletedByRole: null } })
      } else if (chatRoom.deletedByRole == "admin") {
        await ChatRoom.updateOne({
          roomName: message.roomName
        }, { $set: { deletedByRole: null } })
        await Message.updateMany({
          roomName: message.roomName
        }, { $set: { deletedByRole: null } })
      }
      io.to(message.roomName).emit(SOCKET_CHANNELS.RECEIVE_MESSAGE, newMessage);
    });

    socket.on(
      SOCKET_CHANNELS.SEND_NOTIFICATION,
      async (notification: INotification) => {
        const newNotification = new Notification(notification);
        await newNotification.save();
        if (notification.language) {
          let users: Iuser[] = [];
          if (notification.to == NOTIFICATION_TARGET.SELLER) {
            users = await User.find({ language: notification.language, role: 'seller' })
          } else if (notification.to == NOTIFICATION_TARGET.All) {
            users = await User.find({ language: notification.language })
          }
          users.forEach(
            async (user: Iuser) => {
              let notifiData = notification
              notifiData.from = user?.role + "-" + (user?.role === 'seller' ? user?.sellerId.toString() : user?._id.toString())
              const newNotification = new Notification(notifiData);
              await newNotification.save();
            }
          );
        }

        switch (newNotification.to) {
          case NOTIFICATION_TARGET.All:
            const receivers: Iuser[] = await User.find({ language: newNotification.language })
            receivers.forEach(
              (user: Iuser) => {
                socket
                  .to(user._id.toString())
                  .emit(SOCKET_CHANNELS.RECEIVE_NOTIFICATION, newNotification);
              }
            );
            break;
          case NOTIFICATION_TARGET.BUYER:
            socket.join(`${notification.from}`);
            io
              .to(`${notification.from}`)
              .emit(SOCKET_CHANNELS.RECEIVE_NOTIFICATION, newNotification);
            break;
          case NOTIFICATION_TARGET.SELLER:
            const sellReceivers: Iuser[] = await User.find({ language: newNotification.language, role: 'seller' })
            sellReceivers.forEach(
              (user: Iuser) => {
                socket
                  .to(user._id.toString())
                  .emit(SOCKET_CHANNELS.RECEIVE_NOTIFICATION, newNotification);
              }
            );
            break;
          case NOTIFICATION_TARGET.ADMIN:
            socket
              .to(USER_ROOM.ADMIN_ROOM)
              .emit(SOCKET_CHANNELS.RECEIVE_NOTIFICATION, newNotification);
            break;
          default:
            if (!!newNotification.to) {
              const userSocket = totalSockets.find(
                (s) => s.userId.toString() === newNotification.to?.toString()
              );
              if (userSocket) {
                userSocket.socket.emit(
                  SOCKET_CHANNELS.RECEIVE_NOTIFICATION,
                  newNotification
                );
              }
            }
        }
      }
    );
  });
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export const sendNotification = (
  type: NOTIFICATION_TARGET,
  notification: INotification & { _id: mongoose.Types.ObjectId; },
  to: string
) => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  const userSocket = totalSockets.find(s => s.userId.toString() === to);
  if (userSocket) {
    userSocket.socket.emit(type, notification);
  }
};
