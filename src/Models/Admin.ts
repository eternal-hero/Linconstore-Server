import mongoose, { Model } from "mongoose";
import * as validator from "validator";
import * as bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

type TAdmin = {
    token: string
}
export interface IAdmin extends mongoose.Document {
    email: string,
    username: string,
    password: string,
    section: string,
    language: string,
    region: string,
    otp: number,
    tokens: TAdmin[],
    generateAuthToken: () => Promise<string>;
    // [index : string] : string
}
interface IAdminModel extends Model<IAdmin> {
    findByCredentials: (username: string, password: string) => IAdmin
}
const adminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate(value: string) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    username: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value: string) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain password')
            }
        }
    },
    section: {
        type: String,
        trim: true
    },
    language: {
        type: String,
        trim: true,
    },
    region: {
        type: String,
        trim: true,
    },
    otp: {
        type: Number
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})


adminSchema.methods.toJSON = function () {
    const user = this;
    const userObj = user.toObject();
    delete userObj.otp
    delete userObj.password
    delete userObj.tokens;
    return userObj;
}
adminSchema.methods.generateAuthToken = async function () {
    const admin = this;
    const token = await jwt.sign({ _id: admin._id.toString() }, process.env.JWT_SECRET, {
        expiresIn: '6hr'
    })
    admin.tokens = admin.tokens.concat({ token });
    admin.save()
    return token;
}
adminSchema.pre('save', async function (next, opts) {
    const admin = this
    if (admin.isModified('password')) {
        admin.password = await bcrypt.hash(admin.password, 8);
    }
    next()
})
adminSchema.statics.findByCredentials = async function (email, password) {
    const admin = await Admin.findOne({ email });
    if (!admin) {
        throw new Error('Unable to login')
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
        throw new Error('Unable to login')
    }
    return admin;
}
const Admin = mongoose.model<IAdmin, IAdminModel>('admin', adminSchema)

export default Admin;