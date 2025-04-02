import { 
  User, 
  InsertUser, 
  Game, 
  Transaction,
  Deposit,
  Withdrawal,
  users,
  games,
  transactions,
  deposits,
  withdrawals
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser & { referralCode: string, balance: number }): Promise<User>;
  updateUserBalance(id: number, newBalance: number): Promise<void>;
  updateUserSettings(id: number, settings: Partial<User>): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<void>;
  
  // Game methods
  createGame(game: Omit<Game, "id" | "createdAt">): Promise<Game>;
  getUserGames(userId: number): Promise<Game[]>;
  
  // Transaction methods
  createTransaction(transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  updateTransactionStatus(id: number, status: string): Promise<void>;
  
  // Deposit methods
  createDeposit(deposit: Omit<Deposit, "id" | "createdAt" | "updatedAt">): Promise<Deposit>;
  getUserDeposits(userId: number): Promise<Deposit[]>;
  getDepositByWithdrawalCode(withdrawalCode: string): Promise<Deposit | undefined>;
  updateDepositStatus(id: number, status: string): Promise<void>;
  
  // Withdrawal methods
  createWithdrawal(withdrawal: Omit<Withdrawal, "id" | "createdAt" | "updatedAt">): Promise<Withdrawal>;
  getUserWithdrawals(userId: number): Promise<Withdrawal[]>;
  getRecentWithdrawals(): Promise<(Withdrawal & { username: string })[]>;
  updateWithdrawalStatus(id: number, status: string): Promise<void>;
  
  // Leaderboard methods
  getLeaderboard(): Promise<{ userId: number; username: string; totalWinnings: number; gamesPlayed: number; }[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      // We use the DATABASE_URL env variable to avoid hardcoding credentials
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      password: users.password,
      balance: users.balance,
      fullName: users.fullName,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      hiddenBalance: users.hiddenBalance,
      bankName: users.bankName,
      accountNumber: users.accountNumber,
      accountName: users.accountName,
      withdrawalCode: users.withdrawalCode,
      createdAt: users.createdAt
    }).from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      password: users.password,
      balance: users.balance,
      fullName: users.fullName,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      hiddenBalance: users.hiddenBalance,
      bankName: users.bankName,
      accountNumber: users.accountNumber,
      accountName: users.accountName,
      withdrawalCode: users.withdrawalCode,
      createdAt: users.createdAt
    }).from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      password: users.password,
      balance: users.balance,
      fullName: users.fullName,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      hiddenBalance: users.hiddenBalance,
      bankName: users.bankName,
      accountNumber: users.accountNumber,
      accountName: users.accountName,
      withdrawalCode: users.withdrawalCode,
      createdAt: users.createdAt
    }).from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      password: users.password,
      balance: users.balance,
      fullName: users.fullName,
      referralCode: users.referralCode,
      referredBy: users.referredBy,
      hiddenBalance: users.hiddenBalance,
      bankName: users.bankName,
      accountNumber: users.accountNumber,
      accountName: users.accountName,
      withdrawalCode: users.withdrawalCode,
      createdAt: users.createdAt
    }).from(users).where(eq(users.referralCode, referralCode));
    return user;
  }

  async createUser(userData: InsertUser & { referralCode: string, balance: number }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserBalance(id: number, newBalance: number): Promise<void> {
    await db.update(users).set({ balance: newBalance }).where(eq(users.id, id));
  }

  async updateUserSettings(id: number, settings: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users).set(settings).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    await db.update(users).set({ password }).where(eq(users.id, id));
  }

  // Game methods
  async createGame(gameData: Omit<Game, "id" | "createdAt">): Promise<Game> {
    const [game] = await db.insert(games).values({
      ...gameData,
      createdAt: new Date(),
    }).returning();
    return game;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.userId, userId)).orderBy(desc(games.createdAt));
  }

  // Transaction methods
  async createTransaction(transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const now = new Date();
    const [transaction] = await db.insert(transactions).values({
      ...transactionData,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt));
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    await db.update(transactions).set({ 
      status,
      updatedAt: new Date()
    }).where(eq(transactions.id, id));
  }

  // Deposit methods
  async createDeposit(depositData: Omit<Deposit, "id" | "createdAt" | "updatedAt">): Promise<Deposit> {
    const now = new Date();
    const [deposit] = await db.insert(deposits).values({
      ...depositData,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return deposit;
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return await db.select().from(deposits).where(eq(deposits.userId, userId)).orderBy(desc(deposits.createdAt));
  }

  async getDepositByWithdrawalCode(withdrawalCode: string): Promise<Deposit | undefined> {
    const [deposit] = await db.select().from(deposits).where(eq(deposits.withdrawalCode, withdrawalCode));
    return deposit;
  }

  async updateDepositStatus(id: number, status: string): Promise<void> {
    await db.update(deposits).set({ 
      status,
      updatedAt: new Date()
    }).where(eq(deposits.id, id));
  }

  // Withdrawal methods
  async createWithdrawal(withdrawalData: Omit<Withdrawal, "id" | "createdAt" | "updatedAt">): Promise<Withdrawal> {
    const now = new Date();
    const [withdrawal] = await db.insert(withdrawals).values({
      ...withdrawalData,
      createdAt: now,
      updatedAt: now,
    }).returning();
    return withdrawal;
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return await db.select().from(withdrawals).where(eq(withdrawals.userId, userId)).orderBy(desc(withdrawals.createdAt));
  }

  async getRecentWithdrawals(): Promise<(Withdrawal & { username: string })[]> {
    const result = await db
      .select({
        id: withdrawals.id,
        userId: withdrawals.userId,
        transactionId: withdrawals.transactionId,
        amount: withdrawals.amount,
        status: withdrawals.status,
        bankName: withdrawals.bankName,
        accountNumber: withdrawals.accountNumber,
        accountName: withdrawals.accountName,
        createdAt: withdrawals.createdAt,
        updatedAt: withdrawals.updatedAt,
        username: users.username
      })
      .from(withdrawals)
      .innerJoin(users, eq(withdrawals.userId, users.id))
      .where(eq(withdrawals.status, "completed"))
      .orderBy(desc(withdrawals.createdAt))
      .limit(10);
      
    return result;
  }

  async updateWithdrawalStatus(id: number, status: string): Promise<void> {
    await db.update(withdrawals).set({ 
      status,
      updatedAt: new Date()
    }).where(eq(withdrawals.id, id));
  }

  // Leaderboard methods
  async getLeaderboard(): Promise<{ userId: number; username: string; totalWinnings: number; gamesPlayed: number; }[]> {
    const result = await db
      .select({
        userId: games.userId,
        username: users.username,
        totalWinnings: sql<number>`sum(CASE WHEN ${games.isWin} = true THEN ${games.winAmount} ELSE 0 END)`,
        gamesPlayed: sql<number>`count(${games.id})`
      })
      .from(games)
      .innerJoin(users, eq(games.userId, users.id))
      .groupBy(games.userId, users.username)
      .orderBy(desc(sql`sum(CASE WHEN ${games.isWin} = true THEN ${games.winAmount} ELSE 0 END)`))
      .limit(10);
      
    return result;
  }
}

// Use the DatabaseStorage implementation
export const storage = new DatabaseStorage();