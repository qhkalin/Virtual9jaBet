import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { insertGameSchema, insertDepositSchema, insertWithdrawalSchema } from "@shared/schema";
import { setupAuth } from "./auth";
import { setupWebSocketServer } from "./websocket";
import { storage } from "./storage";
import { sendEmail } from "./email";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = setupWebSocketServer(httpServer);
  
  // Game routes
  app.post("/api/games", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      // Add userId to the game data before validation
      const gameData = insertGameSchema.parse({
        ...req.body,
        userId
      });
      
      // Check if user has enough balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.balance < gameData.betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Determine if this is the user's first game
      const userGames = await storage.getUserGames(userId);
      const isFirstGame = userGames.length === 0;
      
      // Generate result - first game always wins, subsequent games have random results
      const possibleNumbers = [2, 3, 4, 5, 6, 7, 8];
      let resultNumber: number;
      
      if (isFirstGame) {
        // First game always wins (bottle lands on chosen number)
        resultNumber = gameData.selectedNumber;
      } else {
        // Choose a random number from the possible numbers
        // 30% chance to win for fairness
        if (Math.random() < 0.3) {
          resultNumber = gameData.selectedNumber;
        } else {
          // Pick a random number different from the selected one
          const otherNumbers = possibleNumbers.filter(n => n !== gameData.selectedNumber);
          resultNumber = otherNumbers[Math.floor(Math.random() * otherNumbers.length)];
        }
      }
      
      const isWin = resultNumber === gameData.selectedNumber;
      const winMultiplier = 1.8; // 1.8x the bet amount for a win
      const winAmount = isWin ? gameData.betAmount * winMultiplier : 0;
      
      // Update user balance
      let newBalance: number;
      if (isWin) {
        newBalance = user.balance - gameData.betAmount + winAmount;
      } else {
        newBalance = user.balance - gameData.betAmount;
      }
      
      await storage.updateUserBalance(userId, newBalance);
      
      // Create game record
      const game = await storage.createGame({
        ...gameData,
        userId,
        resultNumber,
        isWin,
        winAmount: isWin ? winAmount : 0
      });
      
      // Create transaction record
      const transactionType = isWin ? "game_win" : "game_loss";
      const transactionAmount = isWin ? winAmount : gameData.betAmount;
      
      await storage.createTransaction({
        userId,
        type: transactionType,
        amount: transactionAmount,
        details: `Game #${game.id} - ${isWin ? 'Win' : 'Loss'}`
      });
      
      // Send win notification email if user won
      if (isWin) {
        try {
          await sendEmail({
            to: user.email,
            subject: "Congratulations! You won on Virtual9jaBet!",
            text: `Congratulations! You won ₦${winAmount.toFixed(2)} on your recent game.`,
            html: `
              <h2>Congratulations!</h2>
              <p>You won <strong>₦${winAmount.toFixed(2)}</strong> on your recent game.</p>
              <p>Keep playing to win more!</p>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send win notification email:", emailError);
          // Continue with game process even if email fails
        }
      }
      
      // Broadcast win to all connected clients for leaderboard updates
      if (isWin && winAmount >= 5000) {
        wss.broadcast({
          type: "bigWin",
          data: {
            username: user.username,
            amount: winAmount,
            timestamp: new Date(),
          }
        });
      }
      
      res.status(201).json({
        ...game,
        newBalance
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/games/history", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const games = await storage.getUserGames(userId);
      
      res.status(200).json(games);
    } catch (error) {
      next(error);
    }
  });
  
  // Deposit routes
  app.post("/api/deposits", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const depositData = insertDepositSchema.parse(req.body);
      
      // Validate deposit amount
      if (depositData.amount < 1000 || depositData.amount > 500000) {
        return res.status(400).json({ message: "Deposit amount must be between ₦1,000 and ₦500,000" });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount: depositData.amount,
        details: "Manual deposit - pending admin approval"
      });
      
      // Generate one-time withdrawal code
      const withdrawalCode = nanoid(8).toUpperCase();
      
      // Create deposit record
      const deposit = await storage.createDeposit({
        amount: depositData.amount,
        userId,
        transactionId: transaction.id,
        withdrawalCode
      });
      
      // Send withdrawal code to admin
      try {
        await sendEmail({
          to: "denzelbennie@outlook.com",
          subject: `Deposit Request - One-time Withdrawal Code: ${withdrawalCode}`,
          text: `A user has made a deposit request. Amount: ₦${depositData.amount}. User ID: ${userId}. One-time withdrawal code: ${withdrawalCode}`,
          html: `
            <h2>Deposit Request</h2>
            <p>A user has made a deposit request.</p>
            <p><strong>Amount:</strong> ₦${depositData.amount}</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>One-time Withdrawal Code:</strong> ${withdrawalCode}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send withdrawal code email to admin:", emailError);
        // Continue with deposit process even if email fails
      }
      
      res.status(201).json({
        id: deposit.id,
        amount: deposit.amount,
        status: deposit.status,
        createdAt: deposit.createdAt
      });
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/deposits/verify", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { withdrawalCode } = req.body;
      if (!withdrawalCode) {
        return res.status(400).json({ message: "Withdrawal code is required" });
      }
      
      const userId = req.user.id;
      
      // Find deposit by withdrawal code
      const deposit = await storage.getDepositByWithdrawalCode(withdrawalCode);
      if (!deposit) {
        return res.status(404).json({ message: "Invalid withdrawal code" });
      }
      
      // Verify that the deposit belongs to the user
      if (deposit.userId !== userId) {
        return res.status(403).json({ message: "Withdrawal code does not belong to this user" });
      }
      
      // Check if deposit is already completed
      if (deposit.status === "completed") {
        return res.status(400).json({ message: "Deposit has already been processed" });
      }
      
      // Update deposit status
      await storage.updateDepositStatus(deposit.id, "completed");
      
      // Update transaction status
      await storage.updateTransactionStatus(deposit.transactionId, "completed");
      
      // Update user balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newBalance = user.balance + deposit.amount;
      await storage.updateUserBalance(userId, newBalance);
      
      res.status(200).json({
        message: "Deposit verified successfully",
        newBalance
      });
    } catch (error) {
      next(error);
    }
  });
  
  // Withdrawal routes
  app.post("/api/withdrawals", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const withdrawalData = insertWithdrawalSchema.parse(req.body);
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has enough balance
      if (user.balance < withdrawalData.amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId,
        type: "withdrawal",
        amount: withdrawalData.amount,
        details: "Manual withdrawal - pending admin approval"
      });
      
      // Create withdrawal record
      const withdrawal = await storage.createWithdrawal({
        ...withdrawalData,
        userId,
        transactionId: transaction.id
      });
      
      // Deduct the amount from user balance temporarily
      const newBalance = user.balance - withdrawalData.amount;
      await storage.updateUserBalance(userId, newBalance);
      
      // Send withdrawal request to admin
      try {
        await sendEmail({
          to: "denzelbennie@outlook.com",
          subject: "Withdrawal Request",
          text: `
            Withdrawal Request Details:
            Amount: ₦${withdrawalData.amount}
            Bank: ${withdrawalData.bankName}
            Account: ${withdrawalData.accountNumber}
            Account Name: ${withdrawalData.accountName}
            Username: ${user.username}
            Email: ${user.email}
            Balance: ₦${newBalance}
          `,
          html: `
            <h2>Withdrawal Request</h2>
            <p><strong>Amount:</strong> ₦${withdrawalData.amount}</p>
            <p><strong>Bank:</strong> ${withdrawalData.bankName}</p>
            <p><strong>Account:</strong> ${withdrawalData.accountNumber}</p>
            <p><strong>Account Name:</strong> ${withdrawalData.accountName}</p>
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Balance:</strong> ₦${newBalance}</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send withdrawal request email to admin:", emailError);
        // Continue with withdrawal process even if email fails
      }
      
      res.status(201).json({
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        createdAt: withdrawal.createdAt,
        newBalance
      });
    } catch (error) {
      next(error);
    }
  });
  
  // User settings routes
  app.patch("/api/users/settings", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { fullName, email, bankName, accountNumber, accountName, hiddenBalance } = req.body;
      
      // Update user settings
      const updatedUser = await storage.updateUserSettings(userId, {
        fullName,
        email,
        bankName,
        accountNumber,
        accountName,
        hiddenBalance
      });
      
      // If bank details were added, send notification to admin
      if (bankName && accountNumber && accountName) {
        try {
          await sendEmail({
            to: "denzelbennie@outlook.com",
            subject: "User Added Bank Details",
            text: `
              User Added Bank Details:
              User ID: ${userId}
              Username: ${updatedUser.username}
              Bank: ${bankName}
              Account: ${accountNumber}
              Account Name: ${accountName}
            `,
            html: `
              <h2>User Added Bank Details</h2>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Username:</strong> ${updatedUser.username}</p>
              <p><strong>Bank:</strong> ${bankName}</p>
              <p><strong>Account:</strong> ${accountNumber}</p>
              <p><strong>Account Name:</strong> ${accountName}</p>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send bank details email to admin:", emailError);
          // Continue with settings update even if email fails
        }
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  app.patch("/api/users/password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update password
      await storage.updateUserPassword(userId, hashedPassword);
      
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  // Transactions routes
  app.get("/api/transactions", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const transactions = await storage.getUserTransactions(userId);
      
      res.status(200).json(transactions);
    } catch (error) {
      next(error);
    }
  });
  
  // Leaderboard route
  app.get("/api/leaderboard", async (req, res, next) => {
    try {
      const leaderboard = await storage.getLeaderboard();
      res.status(200).json(leaderboard);
    } catch (error) {
      next(error);
    }
  });
  
  // Get recent withdrawals for the feed
  app.get("/api/withdrawals/recent", async (req, res, next) => {
    try {
      const recentWithdrawals = await storage.getRecentWithdrawals();
      res.status(200).json(recentWithdrawals);
    } catch (error) {
      next(error);
    }
  });

  return httpServer;
}

// Helper function for password comparison
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await promisify(scrypt)(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Helper function for password hashing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await promisify(scrypt)(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
