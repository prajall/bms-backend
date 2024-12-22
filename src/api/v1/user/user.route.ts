import express from "express";
import { authValidation } from "../../../middlewares/auth.middleware";
import { handleValidation } from "../../../middlewares/validation.middleware";
import { getUserInfo, loginUser, updateUserRole } from "./user.controller";
import { validateLoginUser, validateSignupUser } from "./user.validation";

const router = express.Router();

// router.post("/signup", validateSignupUser, handleValidation, signupUser);
router.post("/login", validateLoginUser, handleValidation, loginUser);
router.get("/info", authValidation, getUserInfo);
router.patch("/role/:id", authValidation, handleValidation, updateUserRole);
// router.delete("/:userId", validateDeleteUser, handleValidation, deleteUser);

export default router;
