import sgMail from '@sendgrid/mail'
import parsePhoneNumber from 'libphonenumber-js';
import { Twilio } from 'twilio';
import mongoose, { IfAny, Query } from "mongoose";
import baseUrl, { logo, uploadLink } from "../baseurl/baseUrl";
import { IProduct } from "../Models/Product";
import { TProduct, TVariant } from "../Models/Cart";
import { getDateRange, getFormattedDate, reCreateDate } from "./TimeDiff";
import { exchangeCurrency } from "../components/currency/constant";
import { calculateRate } from "./currencyRate";
import { ObjectId } from 'mongodb';

sgMail.setApiKey(process.env.SENDGRID_API as string);
//

const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
    <style>
    a {
        color: #3dd082;;
    }
    .container {
        background-color: #ffffff;
    }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" >
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <img src="https://res.cloudinary.com/linconstore-cloud/image/upload/f_auto,q_auto/v1/web-asset/xl9arigvyokwmrj9wlyb" alt="Logo" style="display: block; width: 80px; height: 80px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <p> We are sorry to see you go 🚶‍♂ 😢. </p>
                    <p> Your account has been successfully deleted from Linconstore database. </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 20px 0; font-size:15px; ">
                    <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                    <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                    <a target="_blank" href="https://linconstore.com/buyer-protection"> Buyer's Protection </a>
                </td>
            </tr>
        </table>
        <p style="text-align: center; font-size: 12px; margin-top: 10px;">
            LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
        </p>
    </div>
</body>
</html>

`

const from = {
    email: process.env.SENDGRIDEMAIL as string,
    name: "Linconstore"
}
const client = new Twilio(process.env.ACCOUNTSID as string, process.env.AUTHTOKEN as string);
export const verifyEmail = async (phone_no: string, email: string, otp: number) => {
    const mes = {
        to: email,
        from,
        subject: 'Email Verification Code',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
            a {
                color: #3dd082;;
            }
            .container {
                background-color: #ffffff;
            }
                @media only screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" >
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="https://res.cloudinary.com/linconstore-cloud/image/upload/f_auto,q_auto/v1/web-asset/xl9arigvyokwmrj9wlyb" alt="Logo" style="display: block; width: 80px; height: 80px;">
                        </td>
                    </tr>
                    <tr>
                    <td align="center" style="padding: 10px 0;">
                    <p>Your verification code is </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <h1> ${otp} </h1>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p> Enter it on Linconstore website to proceed </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0; font-size:15px; ">
                            <a target="_blank" href="https://linconstore.com/about"> About Us</a> |
                            <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                            <a target="_blank" href="https://linconstore.com/buyer-protection"> Buyer's Protection </a>
                        </td>
                    </tr>
                </table>
                <p style="text-align: center; font-size: 12px; margin-top: 10px;">
                    LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
                </p>
            </div>
        </body>
        </html>
        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}
export const verifyAdmin = async (otp: number, email: string) => {
    const messages = {
        to: email,
        from,
        subject: 'OTP for verification',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
            a {
                color: #3dd082;;
            }
            .container {
                background-color: #ffffff;
            }
                @media only screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" >
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="https://res.cloudinary.com/linconstore-cloud/image/upload/f_auto,q_auto/v1/web-asset/xl9arigvyokwmrj9wlyb" alt="Logo" style="display: block; width: 80px; height: 80px;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <p>Your verification code is </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <h1> ${otp} </h1>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <p> Enter it on Linconstore website to proceed </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0; font-size:15px; ">
                            <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                            <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                            <a target="_blank" href="https://linconstore.com/buyer-protection"> Buyer's Protection </a>
                        </td>
                    </tr>
                </table>
                <p style="text-align: center; font-size: 12px; margin-top: 10px;">
                    LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
                </p>
            </div>
        </body>
        </html>
        `
    }
    try {
        await sgMail.send(messages)
    }
    catch (e) {
        console.log(e)
    }
}
export const forgotPassword = async (otp: string, id: mongoose.Types.ObjectId, email: string) => {
    const resetUrl = `${baseUrl}/user/reset?id=${id}&pass=${otp}`;
    const mes = {
        to: email,
        from,
        subject: 'Reset Password',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
            a {
                color: #3dd082;;
            }
            .container {
                background-color: #ffffff;
            }
                @media only screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" >
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="https://res.cloudinary.com/linconstore-cloud/image/upload/f_auto,q_auto/v1/web-asset/xl9arigvyokwmrj9wlyb" alt="Logo" style="display: block; width: 80px; height: 80px;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;"><p>
                        Please click on the following link to  reset your password. </p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center">
                         <a href='${resetUrl}'> Reset Password </a>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0;"><p>
                         Don't recognise this activity? <a target="_black" href="https://www.linconstore.com/help-center/submit-request"> Contact Support </a> immediately</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0; font-size:15px; ">
                            <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                            <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                            <a target="_blank" href="https://linconstore.com/buyer-protection"> Buyer's Protection </a>
                        </td>
                    </tr>
                </table>
                <p style="text-align: center; font-size: 12px; margin-top: 10px;">
                    LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
                </p>
            </div>
        </body>
        </html>
        `        // text: `Please click on the following link to  reset your password. Don't recognise this activity? contact us immediately.`
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}

export const welcomeSellers = async (phone: string, email: string, type: string) => {
    const subject = type ? 'Thank you for choosing to extend with us' : 'Thank you for choosing to sell on Linconstore';
    const text = type ? 'We are excited to have you extend your time with us.' : `
        Welcome to Linconstore, an online marketplace where sellers like yourself can connect with buyers and reach a wide range of customers. 

        By choosing to sell on Linconstore, you are tapping into a platform that offers numerous benefits and opportunities for your business.
        `
    const mes = {
        to: email,
        from,
        subject,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
            a {
                color: #3dd082;;
            }
            .container {
                background-color: #ffffff;
            }
                @media only screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" >
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="https://res.cloudinary.com/linconstore-cloud/image/upload/f_auto,q_auto/v1/web-asset/xl9arigvyokwmrj9wlyb" alt="Logo" style="display: block; width: 80px; height: 80px;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0;"><p>
                        ${text}</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0; font-size:15px; ">
                            <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                            <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                            <a target="_blank" href="https://linconstore.com/buyer-protection"> Buyer's Protection </a>
                        </td>
                    </tr>
                </table>
                <p style="text-align: center; font-size: 12px; margin-top: 10px;">
                    LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
                </p>
            </div>
        </body>
        </html>
        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
    try {
        if (phone) {
            const body = type ? 'Thank you for choosing to extend your stay with us' : 'Thank you for choosing to sell on Linconstore. We are excited to have you as part of our community.'
            const messages = await client.messages.create({
                from: process.env.PHONENO,
                to: parsePhoneNumber(String(phone))!.format('E.164'),
                body
            })
        }
    }
    catch (e) {
        console.log(e)
    }
}
export const sendExperience = async (name: string, message: string) => {
    const mes = {
        to: 'Feedback@linconstore.com',
        from,
        subject: 'New User Experience',
        html: `${message}`,
        // text: `Please click on the following link to  reset your password. Don't recognise this activity? contact us immediately.`
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}

export const replyAdminContact = async (to: string, title: string, message: string) => {
    const mes = {
        to: to,
        from: {
            email: "cs-team@linconstore.com",
            name: "Linconstore"
        },
        subject: title,
        html: `${message}`,
        // text: `Please click on the following link to  reset your password. Don't recognise this activity? contact us immediately.`
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}
export const closeAccount = async (email: string) => {
    const mes = {
        to: email,
        from,
        subject: 'Account Status',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
            a {
                color: #3dd082;;
            }
            .container {
                background-color: #ffffff;
            }
                @media only screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" >
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <img src="https://res.cloudinary.com/linconstore-cloud/image/upload/f_auto,q_auto/v1/web-asset/xl9arigvyokwmrj9wlyb" alt="Logo" style="display: block; width: 80px; height: 80px;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <p>We are sorry to see you go 🚶‍♂ 😢. </p>
                            <p>Your account has been successfully deleted from Linconstore database.</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 20px 0; font-size:15px; ">
                            <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                            <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                            <a target="_blank" href="https://linconstore.com/buyer-protection"> Buyer's Protection </a>
                        </td>
                    </tr>
                </table>
                <p style="text-align: center; font-size: 12px; margin-top: 10px;">
                    LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
                </p>
            </div>
        </body>
        </html>
        
        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}




export const UpdateIdentityVerification = async (email: string, storeName: string) => {
    const mes = {
        to: email,
        from,
        subject: 'Action Required: Verify your identity',
        html: `
      
<!DOCTYPE html>
<html>
<head>
    <style>
        a {
            color: #3dd082;;
        }
        .container {
            background-color: #ffffff;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                background-color: #ffffff;
            }
            .product-details td {
                padding: 5px;
            }
            .shipping-details td {
                padding: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <img src="${logo}" alt="Logo" style="display: block; width: 60px; height: 60px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 16px; margin: 0;">  🔔  IDENTITY VERIFICATION REQUIRED </p>
                </td>
            </tr>
            <tr class="product-details">
                <td align="left">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 400px; margin: 0 auto;">
                        <tr>
                            <td align="left" width="50%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0; font-weight: bold;"> Dear ${storeName}, </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 14px; margin-bottom: 7px; "> To maintain a safe and secure platform for all users, we require your cooperation in verifying your identity on our platform.</p>
                    <p style="font-size: 14px; margin: 0;"> Please use the following link to upload a new document for identity verification</p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <a href="${uploadLink}" style="display: inline-block; padding: 10px 20px; background-color: #3dd082; color: #000000; text-decoration: none; border-radius: 5px;"> Verify Now </a>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 14px; margin: 0;"> If you encounter any issues during the verification process, please contact our support team for immediate assistance. </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 14px; margin-bottom: 7px; "> Thank you for your prompt attention to this matter. </p>
                </td>
            </tr>
            
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                    <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                    <a target="_blank" href="https://linconstore.com/buyer-protection">Buyer's Protection</a>
                </td>
            </tr>
        </table>
        <p style="text-align: center; font-size: 12px; margin-top: 3px;">
            LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
        </p>
    </div>
</body>
</html>

    
        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}




export const UpdateVerificationSuccessful = async (email: string, storeName: string) => {
    const mes = {
        to: email,
        from,
        subject: 'Identity Verification Successful!',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                a {
                    color: #3dd082;;
                }
                .container {
                    background-color: #ffffff;
                }
                @media only screen and (max-width: 600px) {
                    .container {
                        width: 100% !important;
                        background-color: #ffffff;
                    }
                    .product-details td {
                        padding: 5px;
                    }
                    .shipping-details td {
                        padding: 5px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <img src="${logo}" alt="Logo" style="display: block; width: 60px; height: 60px;">
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <p style="font-size: 16px; margin: 0;"> IDENTITY VERIFICATION 🎉 SUCCESSFUL!</p>
                        </td>
                    </tr>
                    <tr class="product-details">
                        <td align="left">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 400px; margin: 0 auto;">
                                <tr>
                                    <td align="left" width="50%">
                                        <p style="display: block; width: 100%; text-align: left; margin: 0; font-weight: bold;"> Dear ${storeName}, </p>
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <p style="font-size: 14px; margin-bottom: 7px; "> We are pleased to inform you that your identity verification on our platform has been successfully completed. Thank you for your cooperation in this process</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <a href="${baseUrl}/login" style="display: inline-block; padding: 10px 20px; background-color: #3dd082; color: #000000; text-decoration: none; border-radius: 5px;"> Go To Store </a>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0;">
                            <p style="font-size: 14px; margin-bottom: 7px; "> If you have any further questions or need assistance with any aspect of our platform, please feel free to reach out to our support team. We are here to help. </p>
                            <p style="font-size: 14px; margin: 0;"> Thank you once again for your cooperation and for being a valued member of our community. </p>
                        </td>
                    </tr>
                    <tr class="product-details">
                        <td align="left">
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 400px; margin: 0 auto;">
                                <tr>
                                    <td align="left" width="50%">
                                        <p style="display: block; width: 100%; text-align: left; margin: 0;"> Best regards, </p>
                                    </td>
                                </tr>
                                
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 10px 0; font-size: 12px;">
                            <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                            <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                            <a target="_blank" href="https://linconstore.com/buyer-protection">Buyer's Protection</a>
                        </td>
                    </tr>
                </table>
                <p style="text-align: center; font-size: 12px; margin-top: 3px;">
                    LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
                </p>
            </div>
        </body>
        </html>
        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}



export const ReUpdateIdentityVerification = async (email: string, storeName: string) => {
    const mes = {
        to: email,
        from,
        subject: '🚫 Verification Document Rejected',
        html: `
      
<!DOCTYPE html>
<html>
<head>
    <style>
        a {
            color: #3dd082;;
        }
        .container {
            background-color: #ffffff;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                background-color: #ffffff;
            }
            .product-details td {
                padding: 5px;
            }
            .shipping-details td {
                padding: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <img src="${logo}" alt="Logo" style="display: block; width: 60px; height: 60px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 16px; margin: 0;"> 🚫 VERIFICATION DOCUMENT REJECTED </p>
                </td>
            </tr>
            <tr class="product-details">
                <td align="left">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 400px; margin: 0 auto;">
                        <tr>
                            <td align="left" width="50%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0; font-weight: bold;"> Dear ${storeName}, </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 14px; margin-bottom: 7px; "> We hope this email finds you well. We regret to inform you that the document you submitted for identity verification has been rejected. We understand that this might be disappointing, but we are here to assist you through the process. </p>
                    <p style="font-size: 14px; margin: 0;"> The rejection could be due to various reasons such as illegibility, outdated information, or an incomplete document. We apologize for any inconvenience caused. To proceed, we kindly request you to re-upload a new document for identity verification using the link provided below </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <a href="${uploadLink}" style="display: inline-block; padding: 10px 20px; background-color: #3dd082; color: #000000; text-decoration: none; border-radius: 5px;"> Verify Now </a>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 14px; margin: 0;"> If you encounter any difficulties during the re-upload process or have any questions, <a target="_black" href="https://www.linconstore.com/help-center/submit-request"> Contact </a> our support team. We are here to assist you every step of the way.</p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 14px; margin-bottom: 7px; "> Thank you for your understanding and cooperation. We look forward to resolving this matter promptly and ensuring a safe and reliable community for all our users. </p>
                </td>
            </tr>
            
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                    <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                    <a target="_blank" href="https://linconstore.com/buyer-protection">Buyer's Protection</a>
                </td>
            </tr>
        </table>
        <p style="text-align: center; font-size: 12px; margin-top: 3px;">
            LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
        </p>
    </div>
</body>
</html>

        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}

export const OrderPlacedNotification = async (total: number, email: string, message: any, shippingType: string, shippingAmount: number, address: any, user: any) => {
    const currency = user.currency;
    const symbol = (exchangeCurrency.find(c => c.label === currency))?.symbol ?? "$"
    const mes = {
        to: email,
        from,
        subject: 'ORDER PLACED - CONFIRMATION',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
        <style>
        a {
            color: #3dd082;;
        }
        .container {
            background-color: #ffffff;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                background-color: #ffffff;
            }
            .product-details td {
                padding: 5px;
            }
            .shipping-details td {
                padding: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <img src="${logo}" alt="Logo" style="display: block; width: 60px; height: 60px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 16px; margin: 0;">ORDER PLACED - CONFIRMATION</p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; ">Your Order has been placed successfully!!!.</p>
                    <p style="font-size: 14px; margin: 0;">We will notify you when your product is shipped by your seller.</p>
                </td>
            </tr>
            <tr class="product-details">
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                      ${message}
                    </table>
                </td>
            </tr>
            <tr class="shipping-details">
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                        <tr>
                            <td align="left" width="30%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0;"> ${shippingType} </p>
                            </td>
                            <td align="right">
                                <p style="display: block; width: 100%; text-align: right; margin: 0;">${symbol} ${shippingAmount}</p>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" width="30%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0;"> Total </p>
                            </td>
                            <td align="right">
                                <p style="display: block; width: 100%; text-align: right; margin: 0;">${symbol} ${total} </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <p style="font-size: 12px; margin: 0;"> Order Date: ${getFormattedDate()} </p>
                    <p style="font-size: 12px; margin: 0;"> Payment Method: Stripe </p>
                    <p style="font-size: 12px; margin: 0;"> Shipping Address: ${address ? `${address.address}, ${address.city}, ${address.country} (${address.zipCode})` : ''} </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; "> Need help with this Order ??? <a target="_black" href="https://www.linconstore.com/help-center/submit-request"> Contact Support </a>  </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                    <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                    <a target="_blank" href="https://linconstore.com/buyer-protection">Buyer's Protection</a>
                </td>
            </tr>
        </table>
        <p style="text-align: center; font-size: 12px; margin-top: 3px;">
            LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
        </p>
    </div>
</body>
</html>
        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}

export const sellerOrderReceived = async (product: any, email: string | undefined, shippingType: string, shippingAmount: number, orderId: any) => {
    const symbol = (exchangeCurrency.find(c => c.value === product.productId.owner.currency))?.symbol ?? "$";

    const mes = {
        to: email,
        from,
        subject: 'NEW ORDER 🎉 - PLACED',
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        a {
            color: #3dd082;;
        }
        .container {
            background-color: #ffffff;
        }
        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                background-color: #ffffff;
            }
            .product-details td {
                padding: 5px;
            }
            .shipping-details td {
                padding: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <img src="${logo}" alt="Logo" style="display: block; width: 60px; height: 60px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 16px; margin: 0;"> NEW ORDER 🎉 - PLACED </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; "> Great news! 🎉 The below product has been ordered from your store! </p>
                    <p style="font-size: 14px; margin: 0;"> Remember to ship the product promptly to your buyer.</p>
                </td>
            </tr>
            <tr class="product-details">
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                    <tr>
                        <td align="center" width="30%">
                            <img src="${product.photo}" alt="Product Image" style="display: block; width: 100%; height: auto; border-radius: 10px;">
                        </td>
                        <td align="left" style="padding: 10px;">
                            <sub style="font-size: 10px; text-align: left;"> Order ID: ${orderId}</sub>
                            <p style="font-size: 14px; margin: 0;"> ${product.name}</p>
                              ${product.variants.length > 0 ? product.variants.map((y: any) => { return `<span style="font-size: 12px; margin: 0;">${y.variant} - ${y.option}</span>` }).join('/') : ''}
                            <p style="font-size: 12px; margin: 0;"> Unit - ${product.quantity}</p>
                            <p style="font-size: 12px; margin: 0;">${symbol} ${product.price * product.quantity}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr class="shipping-details">
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                    <tr>
                        <td align="left" width="30%">
                            <p style="display: block; width: 100%; text-align: left; margin: 0;"> ${shippingType} </p>
                        </td>
                        <td align="right">
                            <p style="display: block; width: 100%; text-align: right; margin: 0;"> ${symbol} ${shippingAmount}</p>
                        </td>
                    </tr>
                    <tr>
                        <td align="left" width="30%">
                            <p style="display: block; width: 100%; text-align: left; margin: 0;"> Total </p>
                        </td>
                        <td align="right">
                            <p style="display: block; width: 100%; text-align: right; margin: 0;"> ${symbol} ${product.price * product.quantity + shippingAmount} </p>
                        </td>
                    </tr>
                </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <a href="${`${baseUrl}/login`}" style="display: inline-block; padding: 10px 20px; background-color: #3dd082; color: #000000; text-decoration: none; border-radius: 5px;"> Go To Store </a>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; "> Have a question ??? <a target="_black" href="https://www.linconstore.com/help-center/submit-request"> Contact Support </a>  </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                    <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                    <a target="_blank" href="https://linconstore.com/buyer-protection">Buyer's Protection</a>
                </td>
            </tr>
        </table>
        <p style="text-align: center; font-size: 12px; margin-top: 3px;">
            LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
        </p>
    </div>
</body>
</html>

        `

    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }


}

export const updateOrderShippedNotification = async (orderId: any, trackingId: string, shipper: string, address: any, user: any, product: any, variants: TVariant[], shippingType: string, shippingAmount: number, date: Date, quantity: number) => {
    const currency = user.currency;
    // console.log(address);
    const symbol = (exchangeCurrency.find(c => c.label === currency))?.symbol ?? "$"; 
    const userRate = await calculateRate(user?.currency?.toLowerCase() ?? "usd");
    const productRate = await calculateRate((product?.owner?.currency)?.toLowerCase() ?? "usd")
    const price = (quantity * product.price * productRate / userRate).toFixed(2);

    const mes = {
        to: user?.email,
        from,
        subject: 'ORDER SHIPPED - CONFIRMATION',
        html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        a {
            color: #3dd082;;
        }
        .container {
            background-color: #ffffff;
        }

        @media only screen and (max-width: 600px) {
            .container {
                width: 100% !important;
                background-color: #ffffff;
            }
            .product-details td {
                padding: 5px;
            }
            .shipping-details td {
                padding: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <img src="${logo}" alt="Logo" style="display: block; width: 60px; height: 60px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 16px; margin: 0;">ORDER SHIPPED - CONFIRMATION</p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; ">Your order has been shipped by the seller.</p>
                    <p style="font-size: 14px; margin: 0;">You can expect the delivery of your product from ${getDateRange(shippingType)}.</p>
                </td>
            </tr>
            <tr class="product-details">
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                                   <tr>
                            <td align="center" width="30%">
                                <img src="${product.photo}" alt="Product Image" style="display: block; width: 100%; height: auto; border-radius: 10px;">
                            </td>
                            <td align="left" style="padding: 10px;">
                                <sub style="font-size: 10px; text-align: left;"> Order ID: ${orderId}</sub>
                                <p style="font-size: 14px; margin: 0;"> ${product.title}</p>
                                
                                  ${variants.length > 0 ? variants.map(y => {
            return `
                            <span style="font-size: 12px; margin: 0;">${y.variant} - ${y.option}</span>
                               `
        }).join('/') : ''}
                                <p style="font-size: 12px; margin: 0;"> Unit - ${quantity}</p>
                                <p style="font-size: 12px; margin: 0;">${symbol} ${price}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 12px; margin: 0;">Tracking ID: ${trackingId}</p>
                    <p style="font-size: 12px; margin: 0;">Shipped By: ${shipper} </p>
                </td>
            </tr>
            <tr class="shipping-details">
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                        <tr>
                            <td align="left" width="30%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0;"> ${shippingType} </p>
                            </td>
                            <td align="right">
                                <p style="display: block; width: 100%; text-align: right; margin: 0;"> ${symbol} ${shippingAmount} </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" width="30%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0;"> Total </p>
                            </td>
                            <td align="right">
                                <p style="display: block; width: 100%; text-align: right; margin: 0;"> ${symbol} ${product.price * quantity + shippingAmount} </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <p style="font-size: 12px; margin: 0;"> Order Date: ${reCreateDate(date)} </p>
                    <p style="font-size: 12px; margin: 0;"> Payment Method: Stripe </p>
                    <p style="font-size: 12px; margin: 0;"> Shipping Address: ${address ? `${address.address}, ${address.city}, ${address.country} (${address.zipCode})` : ''} </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; "> Need help with this Order? <a target="_black" href="https://www.linconstore.com/help-center/submit-request"> Contact Support </a>  </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                    <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                    <a target="_blank" href="https://linconstore.com/buyer-protection">Buyer's Protection</a>
                </td>
            </tr>
        </table>
        <p style="text-align: center; font-size: 12px; margin-top: 3px;">
            LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
        </p>
    </div>
</body>
</html>

        `
    }

    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}


export const orderDeliveredSuccessfully = async (trackingId: string, shipper: string, address: any, user: any, product: any, variants: TVariant[], shippingType: string, shippingAmount: number, date: Date, quantity: number) => {
    const currency = user.currency;
    const symbol = (exchangeCurrency.find(c => c.label === currency))?.symbol ?? "$";
    const userRate = await calculateRate(user?.currency?.toLowerCase() ?? "usd")
    const productRate = await calculateRate((product?.owner.currency)?.toLowerCase() ?? "usd")
    const price = ((quantity * product.price + shippingAmount) * productRate / userRate).toFixed(2);

    const mes = {
        to: user?.email,
        from,
        subject: 'ORDER DELIVERY - FEEDBACK',
        html: `
        
<!DOCTYPE html>
<html>
<head>
    <style>
        a {
            color: #3dd082;;
        }
        .container {
            background-color: #ffffff;
        }
        @media only screen and (max-width: 600px) {
        .container {
            width: 100% !important;
            background-color: #ffffff;
        }
        .product-details td {
            padding: 5px;
        }
        .shipping-details td {
            padding: 5px;
        }
    }
</style>
</head>
<body>
    <div class="container">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <img src="${logo}" alt="Logo" style="display: block; width: 60px; height: 60px;">
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 16px; margin: 0;">ORDER DELIVERED - CONFIRMATION</p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; "> Have you received your product?.</p>
                    <p style="font-size: 14px; margin: 0;">Please consider taking a moment to rate the product, as your feedback will assist other buyers in making more informed decisions about their purchases.</p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #3dd082; color: #ffffff; text-decoration: none; border-radius: 5px;">Rate Product</a>
                </td>
            </tr>
            <tr class="product-details">
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                                <tr>
                            <td align="center" width="30%">
                                <img src="${product.photo}" alt="Product Image" style="display: block; width: 100%; height: auto; border-radius: 10px;">
                            </td>
                            <td align="left" style="padding: 10px;">
                                <sub style="font-size: 10px; text-align: left;"> Product ID: ${product._id}</sub>
                                <p style="font-size: 14px; margin: 0;"> ${product.title}</p>
                                
                                  ${variants.length > 0 ? variants.map(y => {
            return `
                            <span style="font-size: 12px; margin: 0;">${y.variant} - ${y.option}</span>
                               `
        }).join('/') : ''}
                                <p style="font-size: 12px; margin: 0;"> Unit - ${quantity}</p>
                                <p style="font-size: 12px; margin: 0;">${symbol} ${price}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 12px; margin: 0;">Tracking ID: ${trackingId}</p>
                    <p style="font-size: 12px; margin: 0;">Shipped By: ${shipper}</p>
                </td>
            </tr>
            <tr class="shipping-details">
                <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 300px; margin: 0 auto;">
                        <tr>
                            <td align="left" width="30%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0;"> ${shippingType} </p>
                            </td>
                            <td align="right">
                                <p style="display: block; width: 100%; text-align: right; margin: 0;"> ${symbol} ${shippingAmount} </p>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" width="30%">
                                <p style="display: block; width: 100%; text-align: left; margin: 0;"> Total </p>
                            </td>
                            <td align="right">
                                <p style="display: block; width: 100%; text-align: right; margin: 0;">${symbol} ${price} </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <p style="font-size: 12px; margin: 0;"> Order Date: ${reCreateDate(date)} </p>
                    <p style="font-size: 12px; margin: 0;"> Payment Method: Stripe </p>
                    <p style="font-size: 12px; margin: 0;"> Shipping Address: ${address ? `${address.address}, ${address.city}, ${address.country} (${address.zipCode})` : ''} </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0;">
                    <p style="font-size: 15px; margin-bottom: 7px; "> Need help with this Order? <a target="_black" href="https://www.linconstore.com/help-center/submit-request"> Contact Support </a>  </p>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 10px 0; font-size: 12px;">
                    <a target="_blank" href="https://linconstore.com/about">About Us</a> |
                    <a target="_blank" href="https://www.linconstore.com/help-center"> Help Center </a> |
                    <a target="_blank" href="https://linconstore.com/buyer-protection">Buyer's Protection</a>
                </td>
            </tr>
        </table>
        <p style="text-align: center; font-size: 12px; margin-top: 3px;">
            LINCONSTORE LTD is a registered UK company <br> incorporated in Wales and England with the Company Number 14299582
        </p>
    </div>
</body>
</html>
        `
    }
    try {
        await sgMail.send(mes)
    }
    catch (e) {
        console.log(e)
    }
}
