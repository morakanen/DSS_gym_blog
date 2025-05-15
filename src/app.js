import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from 'url';
import session from 'express-session';

import helmetConfig from "./config/helmet.js";
import { sessionMiddleware } from "./config/session.js";
import { loginLimiter } from './config/ratelimiter.js';

import indexRoutes from "./routes/index.routes.js";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust first proxy if behind a reverse proxy (like Railway, Heroku, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(helmetConfig));
app.use(cookieParser(process.env.SESSION_SECRET || 'dev-secret-change-this-in-production'));

// Body parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Session middleware - must come after cookieParser and before routes
app.use(sessionMiddleware);

// Simple session logging
app.use((req, res, next) => {
  console.log('--- New Request ---');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', JSON.stringify(req.session, null, 2));
  next();
});

// Rate limiting applied to /login route
app.use('/login', loginLimiter);

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/test', testRoutes);

// Error handling
app.use(errorMiddleware);

export default app;
