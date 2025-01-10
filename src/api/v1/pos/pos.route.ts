import express from "express";
import { createPOS, getAllPOS, getAllPOSList, getPOSById, updatePOS } from "./pos.controller";

const router = express.Router();

router.post("/", createPOS);
router.get("/", getAllPOS);
router.get("/mini-list", getAllPOSList);
router.get("/:id", getPOSById);
router.put("/:id", updatePOS);

export default router;
