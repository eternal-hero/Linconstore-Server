import mongoose from "mongoose";

export  const dbconnect  = mongoose;

dbconnect.connect(process.env.MONGODB_URL as string)