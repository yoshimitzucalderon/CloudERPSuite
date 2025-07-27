import session from "express-session";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Extend session interface for development
declare module "express-session" {
  interface SessionData {
    user?: any;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Use memory store for development to avoid database connection issues
  return session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Allow HTTP in development
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(claims: any) {
  try {
    await storage.upsertUser({
      id: claims["sub"],
      email: claims["email"],
      firstName: claims["first_name"],
      lastName: claims["last_name"],
      profileImageUrl: claims["profile_image_url"],
    });
  } catch (error) {
    console.log('Error upserting user (development mode):', error);
  }
}

export async function setupDevAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Create a simple development user
  const devUser = {
    id: 'dev-user',
    email: 'dev@localhost',
    firstName: 'Development',
    lastName: 'User',
    profileImageUrl: '',
    claims: {
      sub: 'dev-user',
      email: 'dev@localhost',
      first_name: 'Development',
      last_name: 'User',
      profile_image_url: ''
    },
    access_token: 'dev-token',
    refresh_token: 'dev-refresh-token',
    expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
  };

  // Add development login route that automatically logs in
  app.get("/api/login", (req, res) => {
    req.session.user = devUser;
    res.redirect('/');
  });

  // Add logout route
  app.get("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect('/');
    });
  });

  // Pre-create the development user
  await upsertUser(devUser.claims);
  
  console.log('Development authentication setup complete');
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.session.user as any;

  if (!user || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    req.user = user; // Set user for compatibility
    return next();
  }

  // Token expired, redirect to login
  return res.status(401).json({ message: "Session expired" });
}; 