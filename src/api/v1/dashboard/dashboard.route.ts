import express from "express";
import { getDashboardData } from "./dashboard.controller";

const router = express.Router();

router.get("/", getDashboardData);

export default router;
