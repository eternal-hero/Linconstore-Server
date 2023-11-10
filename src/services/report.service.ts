import Report, { IReport } from "../Models/Report";
import Product from "../Models/Product";
import Store from "../Models/Store";
import Seller from "../Models/Seller";
import User from "../Models/User";

const createReport = async (report: any) => {
    const existing: IReport[] = await Report.find({ productId: report.productId });
    if(existing.length !== 0) {
        let existingReport = existing[0];
        existingReport.reportAmount ++;
        existingReport.save();
        return existingReport
    } else {
        const newReport = new Report({...report, reportAmount: 1});
        await newReport.save();
        return newReport;
    }

}

const getAllReports = async () => {
    const reports: IReport[] = await Report.find({}).populate({
        path: 'productId',
        model: Product,
        populate: {
            path: 'owner',
            model: Store,
            populate: {
                path: 'owner',
                model: Seller,
                populate: {
                    path: 'owner',
                    model: User,                    
                }
            }
        }
    }).populate({
        path: 'owner',
        model: User
    });

    return reports
} 

export const reportService = {
    createReport,
    getAllReports,
}