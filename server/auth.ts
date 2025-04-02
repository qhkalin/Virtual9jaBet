import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { nanoid } from "nanoid";
import { storage } from "./storage";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { sendEmail } from "./email";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate a unique referral code
function generateReferralCode(): string {
  return nanoid(8).toUpperCase();
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "virtualbetsecret12345",
    resave: true,
    saveUninitialized: true,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to false for development to ensure cookies work over HTTP
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        // Send login alert email
        try {
          await sendEmail({
            to: user.email,
            subject: "New Login Alert - Virtual9jaBet",
            text: `A new login was detected on your Virtual9jaBet account. If this wasn't you, please change your password immediately.`,
            html: `
              <h2>New Login Alert</h2>
              <p>A new login was detected on your Virtual9jaBet account.</p>
              <p>If this wasn't you, please change your password immediately.</p>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send login alert email:", emailError);
          // Continue with login process even if email fails
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, referralCode, ...userData } = req.body;

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Handle referral if provided
      let referredById = null;
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          referredById = referrer.id;
          
          // Add referral bonus to the referrer (₦1,500)
          await storage.updateUserBalance(referrer.id, referrer.balance + 1500);
          
          // Create a transaction record for the referral bonus
          await storage.createTransaction({
            userId: referrer.id,
            type: "referral_bonus",
            amount: 1500,
            status: "completed",
            details: `Referral bonus for referring ${username}`
          });
        }
      }

      // Create new user with hashed password and generated referral code
      const newReferralCode = generateReferralCode();
      const user = await storage.createUser({
        ...userData,
        username,
        email,
        password: await hashPassword(password),
        referralCode: newReferralCode,
        referredBy: referredById,
        balance: 2000, // ₦2,000 signup bonus
      });

      // Create a transaction record for the signup bonus
      await storage.createTransaction({
        userId: user.id,
        type: "signup_bonus",
        amount: 2000,
        status: "completed",
        details: "Welcome bonus for new account"
      });

      // Send welcome email
      try {
        await sendEmail({
          to: email,
          subject: "Welcome to Virtual9jaBet!",
          text: `Welcome to Virtual9jaBet! Your account has been successfully created. Your referral code is: ${newReferralCode}`,
          html: `
            <h2>Welcome to Virtual9jaBet!</h2>
            <p>Your account has been successfully created.</p>
            <p>Your referral code is: <strong>${newReferralCode}</strong></p>
            <p>Share this code with your friends and earn ₦1,500 for each referral!</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Continue with registration process even if email fails
      }

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: SelectUser | undefined, info: { message?: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
