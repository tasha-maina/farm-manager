import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recordsRouter from './routes/records.js';
import dashboardRouter from './routes/dashboard.js';
import milkRouter from './routes/milk.js';
import assetsRouter from './routes/assets.js';
import backupRouter from './routes/backup.js';
import aiRouter from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) || true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '15mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Smart Farm Manager API is running smoothly' });
});

app.use('/api/records', recordsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/milk', milkRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/ai', aiRouter);

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Smart Farm Manager API listening on http://localhost:${PORT}`);
  });
}

export default app;

