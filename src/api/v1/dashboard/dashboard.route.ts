import express from "express";
import { getKPI } from "./dashboard.controller";

const router = express.Router();

router.get("/kpi", getKPI);

export default router;
