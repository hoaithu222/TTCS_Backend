import { Request, Response } from "express";
import WalletService from "./wallet.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

/**
 * Get wallet balance (user or shop)
 * Returns both user and shop wallets if user is shop owner
 */
export const getBalanceController = async (req: Request, res: Response) => {
  const result = await WalletService.getBalance(req as AuthenticatedRequest);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { 
      balance: result.balance, 
      wallet: result.wallet,
      shopWallet: (result as any).shopWallet || null,
      shop: (result as any).shop || null,
    },
    "Wallet balance retrieved successfully"
  );
};

/**
 * Create deposit request
 * Supports walletType query param: ?walletType=user|shop
 */
export const createDepositController = async (req: Request, res: Response) => {
  const result = await WalletService.createDeposit(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    {
      transaction: result.transaction,
      qrCode: result.qrCode,
      paymentUrl: (result as any).paymentUrl, // VNPay payment URL if enabled
      expiresAt: (result as any).expiresAt, // QR expiration time
      bankAccount: result.bankAccount,
      instructions: result.instructions,
    },
    "Deposit request created successfully"
  );
};

/**
 * Get wallet transactions (user or shop)
 */
export const getTransactionsController = async (req: Request, res: Response) => {
  const result = await WalletService.getTransactions(
    req as AuthenticatedRequest,
    req.query as any
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  // Format response to match frontend expectation
  return ResponseUtil.success(
    res,
    {
      transactions: result.transactions,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    },
    "Transactions retrieved successfully"
  );
};

/**
 * Withdraw money from shop wallet
 */
export const withdrawFromShopController = async (req: Request, res: Response) => {
  const result = await WalletService.withdrawFromShop(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { transaction: result.transaction, balance: result.balance },
    "Withdrawal successful"
  );
};

/**
 * Update bank information for wallet
 */
export const updateBankInfoController = async (req: Request, res: Response) => {
  const result = await WalletService.updateBankInfo(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { wallet: result.wallet },
    "Bank information updated successfully"
  );
};

/**
 * Transfer money between user and shop wallets
 * Hiện tại ví user và ví shop đã được gộp nên API này chỉ trả về thông báo lỗi nếu được gọi.
 */
export const transferBetweenWalletsController = async (req: Request, res: Response) => {
  const result = await WalletService.transferBetweenWallets(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { message: result.message },
    "Transfer successful"
  );
};

/**
 * Admin: Update transaction status manually
 */
export const updateTransactionStatusController = async (req: Request, res: Response) => {
  const { transactionId } = req.params;
  const result = await WalletService.updateTransactionStatus(
    req as AuthenticatedRequest,
    transactionId,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { transaction: result.transaction },
    "Transaction status updated successfully"
  );
};

/**
 * Admin: Get all pending transactions
 */
export const getPendingTransactionsController = async (req: Request, res: Response) => {
  const result = await WalletService.getPendingTransactions(
    req as AuthenticatedRequest,
    req.query as any
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    result.transactions,
    "Pending transactions retrieved successfully",
    200,
    1,
    {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    }
  );
};

