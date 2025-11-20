"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("./wallet.controller");
const webhook_controller_1 = require("./webhook.controller");
const auth_middleware_1 = require("../../shared/middlewares/auth.middleware");
const walletRouter = (0, express_1.Router)();
// Get wallet balance (authenticated)
walletRouter.get("/balance", auth_middleware_1.authenticateToken, wallet_controller_1.getBalanceController);
// Create deposit request (authenticated)
walletRouter.post("/deposit", auth_middleware_1.authenticateToken, wallet_controller_1.createDepositController);
// Get wallet transactions (authenticated)
walletRouter.get("/transactions", auth_middleware_1.authenticateToken, wallet_controller_1.getTransactionsController);
// Withdraw from shop wallet (authenticated - shop owner only)
walletRouter.post("/withdraw", auth_middleware_1.authenticateToken, wallet_controller_1.withdrawFromShopController);
// Update bank information (authenticated)
walletRouter.put("/bank-info", auth_middleware_1.authenticateToken, wallet_controller_1.updateBankInfoController);
// Transfer between user and shop wallets (authenticated - shop owner only)
walletRouter.post("/transfer", auth_middleware_1.authenticateToken, wallet_controller_1.transferBetweenWalletsController);
// Webhook receiver for bank transfer (no auth required)
// This route should be accessible at /api/webhook-receiver
walletRouter.post("/webhook-receiver", webhook_controller_1.webhookReceiverController);
// Test webhook for demo/testing (no auth required for testing)
walletRouter.post("/test-webhook", webhook_controller_1.testWebhookController);
// Admin routes
// Get pending transactions (admin only)
walletRouter.get("/admin/pending", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), wallet_controller_1.getPendingTransactionsController);
// Update transaction status (admin only)
walletRouter.put("/admin/transactions/:transactionId/status", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorize)(["admin"]), wallet_controller_1.updateTransactionStatusController);
exports.default = walletRouter;
