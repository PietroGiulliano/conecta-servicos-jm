import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import categoriesRoutes from "../modules/categories/categories.routes";
import providersRoutes from "../modules/providers/providers.routes";
import favoritesRoutes from "../modules/providers/favorites.routes";
import serviceRequestsRoutes from "../modules/serviceRequests/serviceRequests.routes";
import proposalsRoutes from "../modules/proposals/proposals.routes";
import ordersRoutes from "../modules/orders/orders.routes";
import paymentsRoutes from "../modules/payments/payments.routes";
import walletRoutes from "../modules/wallet/wallet.routes";
import reviewsRoutes from "../modules/reviews/reviews.routes";
import messagesRoutes from "../modules/messages/messages.routes";
import notificationsRoutes from "../modules/notifications/notifications.routes";
import adminRoutes from "../modules/admin/admin.routes";
import companyRoutes from "../modules/companies.routes";
import providerPaymentRoutes from "../modules/providers/providerPayment.routes";
import uploadsRoutes from "../modules/uploads/uploads.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/providers", providersRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/service-requests", serviceRequestsRoutes);
router.use("/proposals", proposalsRoutes);
router.use("/orders", ordersRoutes);
router.use("/payments", paymentsRoutes);
router.use("/wallet", walletRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/messages", messagesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/admin", adminRoutes);
router.use("/companies", companyRoutes);
router.use("/providers/payment", providerPaymentRoutes);
router.use("/uploads", uploadsRoutes);

router.get("/health", (_req, res) => res.json({ status: "ok" }));

export default router;
