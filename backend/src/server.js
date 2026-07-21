import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import recordsRouter from './routes/records.js';
import dashboardRouter from './routes/dashboard.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((origin) => origin.trim()).filter(Boolean) || true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Farm manager API is running' });
});

app.use('/api/records', recordsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Farm manager API listening on http://localhost:${PORT}`);
});
