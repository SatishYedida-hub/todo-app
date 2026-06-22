require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { initDb } = require('./db');
const swaggerSpec = require('./swagger');
const authRoutes = require('./routes/auth');
const todoRoutes = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/auth', authRoutes);
app.use('/', todoRoutes);

async function waitForDb(retries = 30, delayMs = 5000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await initDb();
      return;
    } catch (err) {
      console.log(`DB not ready (attempt ${i}/${retries}): ${err.message}`);
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function start() {
  await waitForDb();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger docs at /api-docs`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  process.exit(1);
});
