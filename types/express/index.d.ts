import {Iuser} from  '../../src/Models/User'
import {Iseller} from "../../src/Models/Seller";
import {IAdmin} from "../../src/Models/Admin";


declare module 'express-serve-static-core'{
    interface Request {
        user : Iuser;
        token : string;
        seller: Iseller,
        admin: IAdmin
    }
}