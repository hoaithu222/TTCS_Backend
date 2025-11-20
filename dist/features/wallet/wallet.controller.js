"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPendingTransactionsController = exports.updateTransactionStatusController = exports.transferBetweenWalletsController = exports.updateBankInfoController = exports.withdrawFromShopController = exports.getTransactionsController = exports.createDepositController = exports.getBalanceController = void 0;
const wallet_service_1 = __importDefault(require("./wallet.service"));
const response_util_1 = require("../../shared/utils/response.util");
/**
 * Get wallet balance (user or shop)
 * Returns both user and shop wallets if user is shop owner
 */
const getBalanceController = async (req, res) => {
    const result = await wallet_service_1.default.getBalance(req);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, {
        balance: result.balance,
        wallet: result.wallet,
        shopWallet: result.shopWallet || null,
        shop: result.shop || null,
    }, "Wallet balance retrieved successfully");
};
exports.getBalanceController = getBalanceController;
/**
 * Create deposit request
 * Supports walletType query param: ?walletType=user|shop
 */
const createDepositController = async (req, res) => {
    const result = await wallet_service_1.default.createDeposit(req, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, {
        transaction: result.transaction,
        qrCode: result.qrCode,
        paymentUrl: result.paymentUrl, // VNPay payment URL if enabled
        expiresAt: result.expiresAt, // QR expiration time
        bankAccount: result.bankAccount,
        instructions: result.instructions,
    }, "Deposit request created successfully");
};
exports.createDepositController = createDepositController;
/**
 * Get wallet transactions (user or shop)
 */
const getTransactionsController = async (req, res) => {
    const result = await wallet_service_1.default.getTransactions(req, req.query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    // Format response to match frontend expectation
    return response_util_1.ResponseUtil.success(res, {
        transactions: result.transactions,
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    }, "Transactions retrieved successfully");
};
exports.getTransactionsController = getTransactionsController;
/**
 * Withdraw money from shop wallet
 */
const withdrawFromShopController = async (req, res) => {
    const result = await wallet_service_1.default.withdrawFromShop(req, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { transaction: result.transaction, balance: result.balance }, "Withdrawal successful");
};
exports.withdrawFromShopController = withdrawFromShopController;
/**
 * Update bank information for wallet
 */
const updateBankInfoController = async (req, res) => {
    const result = await wallet_service_1.default.updateBankInfo(req, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { wallet: result.wallet }, "Bank information updated successfully");
};
exports.updateBankInfoController = updateBankInfoController;
/**
 * Transfer money between user and shop wallets
 */
const transferBetweenWalletsController = async (req, res) => {
    const result = await wallet_service_1.default.transferBetweenWallets(req, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, {
        userWallet: result.userWallet,
        shopWallet: result.shopWallet,
        message: result.message,
    }, "Transfer successful");
};
exports.transferBetweenWalletsController = transferBetweenWalletsController;
/**
 * Admin: Update transaction status manually
 */
const updateTransactionStatusController = async (req, res) => {
    const { transactionId } = req.params;
    const result = await wallet_service_1.default.updateTransactionStatus(req, transactionId, req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, { transaction: result.transaction }, "Transaction status updated successfully");
};
exports.updateTransactionStatusController = updateTransactionStatusController;
/**
 * Admin: Get all pending transactions
 */
const getPendingTransactionsController = async (req, res) => {
    const result = await wallet_service_1.default.getPendingTransactions(req, req.query);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status);
    }
    return response_util_1.ResponseUtil.success(res, result.transactions, "Pending transactions retrieved successfully", 200, 1, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
    });
};
exports.getPendingTransactionsController = getPendingTransactionsController;
