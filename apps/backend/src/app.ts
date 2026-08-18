import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

export default app;
