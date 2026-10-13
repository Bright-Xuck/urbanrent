import app from './app.js';

const PORT = (process.env.PORT) || 5000;

// Redis is connected before anything uses it (top-level await in
// config/redis.ts, which the rate limiters import), so counts are
// live from the very first request.
app.listen(PORT, () => {
  console.log(`Server is listening on http://localhost:${PORT}`);
});
