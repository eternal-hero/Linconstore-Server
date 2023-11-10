import { Request, Response } from "express";
import { services } from "../services";

const addNewReport = async (req: Request, res: Response) => {
    try {
        const result = await services.reportService.createReport(req.body)
        res.status(200).send(result)
    } catch (e) {
        res.status(500).send('Internal Server Error')
    }
}

const getReports = async (req: Request, res: Response) => {
    try {
        const result = await services.reportService.getAllReports();
        res.status(200).send(result)
    } catch(e) {
        res.status(500).send('Internal Server Error')
    }
}


export const ReportController = {
    addNewReport,
    getReports,
}