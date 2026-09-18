import { Router } from "express";
import { authLimiter } from "../../middlewares/rateLimit";
import * as controller from "./auth.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.post("/register/cliente", authLimiter, asyncHandler(controller.registerCustomer));
router.post("/register/prestador", authLimiter, asyncHandler(controller.registerProvider));
router.post("/register/empresa", authLimiter, asyncHandler(controller.registerCompany));
router.post("/login", authLimiter, asyncHandler(controller.login));
router.post("/refresh", asyncHandler(controller.refresh));
router.post("/logout", asyncHandler(controller.logout));
router.post("/forgot-password", authLimiter, asyncHandler(controller.forgotPassword));
router.post("/reset-password", authLimiter, asyncHandler(controller.resetPassword));

export default router;
