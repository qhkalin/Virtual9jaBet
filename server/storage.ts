import { 
  User, 
  InsertUser, 
  Game, 
  Transaction,
  Deposit,
  Withdrawal
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private games: Map<number, Game>;
  private transactions: Map<number, Transaction>;
  private deposits: Map<number, Deposit>;
  private withdrawals: Map<number, Withdrawal>;
  
  sessionStore: session.SessionStore;
  currentUserId: number;
  currentGameId: number;
  currentTransactionId: number;
  currentDepositId: number;
  currentWithdrawalId: number;

  constructor() {
    this.users = new Map();
    this.games = new Map();
    this.transactions = new Map();
    this.deposits = new Map();
    this.withdrawals = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    this.currentUserId = 1;
    this.currentGameId = 1;
    this.currentTransactionId = 1;
    this.currentDepositId = 1;
    this.currentWithdrawalId = 1;
    
    // Create initial simulated withdrawals for the feed
    this.createInitialWithdrawals();
  }

  private createInitialWithdrawals() {
    const names = [
      "James", "Sarah", "Emeka", "Fatima", "Oluwole", 
      "Chioma", "Ahmed", "Ngozi", "Emmanuel", "Aisha", 
      "Tunde", "Blessing", "Yusuf", "Amina", "Victor"
    ];
    
    const amounts = [
      5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000
    ];
    
    // Create 300+ simulated withdrawals
    for (let i = 0; i < 300; i++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      const userId = 1000 + i; // Fake user IDs starting from 1000
      
      // Create a simulated user
      this.users.set(userId, {
        id: userId,
        username: `${name}${userId}`,
        email: `${name.toLowerCase()}${userId}@example.com`,
        password: "hashed_password",
        balance: 10000,
        referralCode: `REF${userId}`,
        fullName: `${name} User`,
        hiddenBalance: false,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      } as User);
      
      // Create a transaction for the withdrawal
      const transactionId = 10000 + i;
      this.transactions.set(transactionId, {
        id: transactionId,
        userId,
        type: "withdrawal",
        amount,
        status: "completed",
        details: "Simulated withdrawal",
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
      } as Transaction);
      
      // Create a withdrawal record
      const withdrawalId = 10000 + i;
      this.withdrawals.set(withdrawalId, {
        id: withdrawalId,
        userId,
        transactionId,
        amount,
        bankName: "Bank Name",
        accountNumber: "1234567890",
        accountName: `${name} User`,
        status: "completed",
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000)
      } as Withdrawal);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.referralCode === referralCode
    );
  }

  async createUser(userData: InsertUser & { referralCode: string, balance: number }): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = {
      ...userData,
      id,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserBalance(id: number, newBalance: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.balance = newBalance;
      this.users.set(id, user);
    }
  }

  async updateUserSettings(id: number, settings: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error("User not found");
    }
    
    const updatedUser = { ...user, ...settings };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.password = password;
      this.users.set(id, user);
    }
  }

  // Game methods
  async createGame(gameData: Omit<Game, "id" | "createdAt">): Promise<Game> {
    const id = this.currentGameId++;
    const now = new Date();
    const game: Game = {
      ...gameData,
      id,
      createdAt: now
    };
    this.games.set(id, game);
    return game;
  }

  async getUserGames(userId: number): Promise<Game[]> {
    return Array.from(this.games.values())
      .filter(game => game.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Transaction methods
  async createTransaction(transactionData: Omit<Transaction, "id" | "createdAt" | "updatedAt">): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const now = new Date();
    const transaction: Transaction = {
      ...transactionData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateTransactionStatus(id: number, status: string): Promise<void> {
    const transaction = this.transactions.get(id);
    if (transaction) {
      transaction.status = status;
      transaction.updatedAt = new Date();
      this.transactions.set(id, transaction);
    }
  }

  // Deposit methods
  async createDeposit(depositData: Omit<Deposit, "id" | "createdAt" | "updatedAt">): Promise<Deposit> {
    const id = this.currentDepositId++;
    const now = new Date();
    const deposit: Deposit = {
      ...depositData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.deposits.set(id, deposit);
    return deposit;
  }

  async getUserDeposits(userId: number): Promise<Deposit[]> {
    return Array.from(this.deposits.values())
      .filter(deposit => deposit.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getDepositByWithdrawalCode(withdrawalCode: string): Promise<Deposit | undefined> {
    return Array.from(this.deposits.values()).find(
      (deposit) => deposit.withdrawalCode === withdrawalCode
    );
  }

  async updateDepositStatus(id: number, status: string): Promise<void> {
    const deposit = this.deposits.get(id);
    if (deposit) {
      deposit.status = status;
      deposit.updatedAt = new Date();
      this.deposits.set(id, deposit);
    }
  }

  // Withdrawal methods
  async createWithdrawal(withdrawalData: Omit<Withdrawal, "id" | "createdAt" | "updatedAt">): Promise<Withdrawal> {
    const id = this.currentWithdrawalId++;
    const now = new Date();
    const withdrawal: Withdrawal = {
      ...withdrawalData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.withdrawals.set(id, withdrawal);
    return withdrawal;
  }

  async getUserWithdrawals(userId: number): Promise<Withdrawal[]> {
    return Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentWithdrawals(): Promise<(Withdrawal & { username: string })[]> {
    // Get all completed withdrawals
    const completedWithdrawals = Array.from(this.withdrawals.values())
      .filter(withdrawal => withdrawal.status === "completed")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Attach username to each withdrawal
    return completedWithdrawals.map(withdrawal => {
      const user = this.users.get(withdrawal.userId);
      return {
        ...withdrawal,
        username: user ? user.username : "Unknown User"
      };
    });
  }

  async updateWithdrawalStatus(id: number, status: string): Promise<void> {
    const withdrawal = this.withdrawals.get(id);
    if (withdrawal) {
      withdrawal.status = status;
      withdrawal.updatedAt = new Date();
      this.withdrawals.set(id, withdrawal);
    }
  }

  // Leaderboard methods
  async getLeaderboard(): Promise<{ userId: number; username: string; totalWinnings: number; gamesPlayed: number; }[]> {
    // Get all users
    const users = Array.from(this.users.values());
    
    // Initialize leaderboard entries
    const leaderboardEntries: Map<number, { userId: number; username: string; totalWinnings: number; gamesPlayed: number; }> = new Map();
    
    // Calculate total winnings and games played for each user
    for (const user of users) {
      const userGames = await this.getUserGames(user.id);
      const gamesPlayed = userGames.length;
      
      if (gamesPlayed === 0) continue;
      
      const totalWinnings = userGames
        .filter(game => game.isWin)
        .reduce((sum, game) => sum + (game.winAmount || 0), 0);
      
      leaderboardEntries.set(user.id, {
        userId: user.id,
        username: user.username,
        totalWinnings,
        gamesPlayed
      });
    }
    
    // Sort by total winnings (descending)
    return Array.from(leaderboardEntries.values())
      .sort((a, b) => b.totalWinnings - a.totalWinnings)
      .slice(0, 10); // Get top 10
  }
}

export const storage = new MemStorage();
