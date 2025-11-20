import { Router } from "express";
import {
  getBalanceController,
  createDepositController,
  getTransactionsController,
  withdrawFromShopController,
  updateBankInfoController,
  transferBetweenWalletsController,
  updateTransactionStatusController,
  getPendingTransactionsController,
} from "./wallet.controller";
import { webhookReceiverController, testWebhookController } from "./webhook.controller";
import { authenticateToken, authorize } from "../../shared/middlewares/auth.middleware";

const walletRouter = Router();

// Get wallet balance (authenticated)
walletRouter.get("/balance", authenticateToken, getBalanceController);

// Create deposit request (authenticated)
walletRouter.post("/deposit", authenticateToken, createDepositController);

// Get wallet transactions (authenticated)
walletRouter.get("/transactions", authenticateToken, getTransactionsController);

// Withdraw from shop wallet (authenticated - shop owner only)
walletRouter.post("/withdraw", authenticateToken, withdrawFromShopController);

// Update bank information (authenticated)
walletRouter.put("/bank-info", authenticateToken, updateBankInfoController);

// Transfer between user and shop wallets (authenticated - shop owner only)
walletRouter.post("/transfer", authenticateToken, transferBetweenWalletsController);

// Webhook receiver for bank transfer (no auth required)
// This route should be accessible at /api/webhook-receiver
walletRouter.post("/webhook-receiver", webhookReceiverController);

// Test webhook for demo/testing (no auth required for testing)
walletRouter.post("/test-webhook", testWebhookController);

// Admin routes
// Get pending transactions (admin only)
walletRouter.get(
  "/admin/pending",
  authenticateToken,
  authorize(["admin"]),
  getPendingTransactionsController
);

// Update transaction status (admin only)
walletRouter.put(
  "/admin/transactions/:transactionId/status",
  authenticateToken,
  authorize(["admin"]),
  updateTransactionStatusController
);

export default walletRouter;

