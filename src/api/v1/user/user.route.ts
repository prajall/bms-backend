import express from "express";
import { authValidation } from "../../../middlewares/auth.middleware";
import { handleValidation } from "../../../middlewares/validation.middleware";
import { getUserInfo, loginUser } from "./user.controller";
import { validateLoginUser } from "./user.validation";

const router = express.Router();

// router.post("/signup", validateSignupUser, handleValidation, signupUser);
router.post("/login", validateLoginUser, handleValidation, loginUser);
router.get("/info", authValidation, getUserInfo);
// router.delete("/:userId", validateDeleteUser, handleValidation, deleteUser);

export default router;
