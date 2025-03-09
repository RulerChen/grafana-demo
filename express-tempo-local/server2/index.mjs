import express from 'express';
import pg from 'pg';
import { trace } from '@opentelemetry/api';

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  host: 'postgres',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

app.get('/api/book/:bookId', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, title FROM books WHERE id = $1', [
      req.params.bookId
    ]);
    if (result.rowCount === 0) {
      return res.status(404).send('Book not found');
    }
    res.status(200).send(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/api/book', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).send('Title is required');
    }
    await pool.query('INSERT INTO books (title) VALUES ($1)', [title]);
    res.status(201).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.delete('/api/book/:bookId', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.bookId]);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.listen(8000, async () => {
  try {
    await pool.connect();
    await pool.query(`
    CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL
        )
    `);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
  console.log('Server is running on http://localhost:8000');
});
