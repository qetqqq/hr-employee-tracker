const express = require('express');
const path = require('path');
const { getDb } = require('./db/database');
const employeesRouter = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/employees', employeesRouter);

async function start() {
  try {
    await getDb();
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();