import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from 'url';

import helmetConfig from "./config/helmet.js";
import sessionConfig from "./config/session.js";
import indexRoutes from "./routes/index.routes.js";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

console.log('auth routes imported');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet(helmetConfig));
app.use(cookieParser());

// Body parsing
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session(sessionConfig));

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/test', testRoutes);

// Error handling
app.use(errorMiddleware);

export default app;