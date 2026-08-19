import express, { type Express } from 'express';
import authRoutes from './routes/authRoutes.js';

const app: Express = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);

export default app;