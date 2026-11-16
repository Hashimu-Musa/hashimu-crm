import { Router } from "express";
import { asyncHandler } from "../middleware/errors.js";
import { requireAuth } from "../middleware/auth.js";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/me", requireAuth, asyncHandler(authController.me));

export default router;
