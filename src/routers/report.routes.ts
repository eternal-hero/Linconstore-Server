import express, { Router } from "express";
import { controller } from "../controllers";

const router: Router = express.Router();

router.get('/api/report', controller.ReportController.getReports)
router.post('/api/report', controller.ReportController.addNewReport)

export default router