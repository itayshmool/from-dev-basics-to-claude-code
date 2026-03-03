import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './lib/env.js';
import { levelsRouter, lessonsRouter } from './routes/levels.js';
import { authRouter } from './routes/auth.js';
import { progressRouter } from './routes/progress.js';
import { adminRouter } from './routes/admin.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS
const origins = env.CORS_ORIGIN.split(',').map(s => s.trim());
app.use(cors({
  origin: origins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/levels', levelsRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/auth', authRouter);
app.use('/api/progress', progressRouter);
app.use('/api/admin', adminRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
