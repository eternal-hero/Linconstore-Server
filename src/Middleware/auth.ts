import jwt from 'jsonwebtoken'
import User, {Iuser} from "../Models/User";
import express, {NextFunction, Request, Response} from "express";
import Seller, {Iseller} from "../Models/Seller";
import Admin from "../Models/Admin";
import {stripe} from "../app";
import {checkIfDateIsExpired} from "../Helpers/TimeDiff";
import {checkSubscription} from "../Helpers/helpers";


export const auth : express.RequestHandler = async (req :Request  , res : Response, next : NextFunction) => {
    try {
        const token = req.header('Authorization')!.replace('Bearer ', '');
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token});
        const admin = await Admin.findOne({_id:decoded._id})
        if(!user){
            if(!admin) {
                throw new Error()
            }
        } else {
            if (!user?.isVerified){
                throw new Error('User is not verified')
            }
        }
        req.token = token;
        if(user) {
            req.user = user
        }

        if(admin) {
            req.admin = admin
        }
        next();
    }
    catch (e) {
        res.status(403).send({error : 'Please Authenticate'})
    }
}

export const sellerAuth : express.RequestHandler = async (req: Request, res: Response, next : NextFunction) => {
    try {
        const token = req.header('Authorization')!.replace('Bearer ', '');
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        const seller = await Seller.findOne({owner: decoded._id});
        if(!seller){
            throw new Error()
        }
        req.seller = seller;
        next();
    }
    catch (e) {
        res.status(401).send({error : 'Please Authenticate'})
    }

}
export const adminAuth : express.RequestHandler = async (req :Request  , res : Response, next : NextFunction) => {
    try {
        const token = req.header('Authorization')!.replace('Bearer ', '');
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findOne({_id: decoded._id, 'tokens.token': token});
        if(!admin){
            throw new Error()
        }
        req.token = token;
        req.admin = admin;
        next();
    }
    catch (e) {
        res.status(403).send({error : 'Please Authenticate'})
    }
}
export const activeSeller : express.RequestHandler = async (req : Request, res: Response, next : NextFunction) => {
    try {
        const token = req.header('Authorization')!.replace('Bearer ', '');
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);
        const seller : Iseller | null  = await Seller.findOne({owner: decoded._id});
        if(!seller){
            throw new Error()
        }
        if (seller.package === 'Premium'){
            const sub = await stripe.subscriptions.retrieve(seller!.subId)
            const endDate = new Date(sub.current_period_end * 1000);
            const isPastGracePeriod = checkSubscription(endDate)
            if(isPastGracePeriod){
                seller.package = 'free'
                await seller.save()
            }
        }
        if (!seller.isVerified){
            throw new Error('Seller is not verified')
        }
        req.seller = seller;
        next();
    }
    catch (e) {
        res.status(401).send({error : 'Please Authenticate'})
    }

}