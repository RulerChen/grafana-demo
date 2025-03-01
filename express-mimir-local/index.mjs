import express from 'express';
import promClient from 'prom-client';
import pg from 'pg';

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  host: 'postgres',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

const register = new promClient.Registry();
register.setContentType(promClient.Registry.OPENMETRICS_CONTENT_TYPE);

promClient.collectDefaultMetrics({ register });

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
register.registerMetric(httpRequestCounter);

const httpRequestDurationHistogram = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.02, 0.03, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 2, 3, 4, 5, 10]
});
register.registerMetric(httpRequestDurationHistogram);

const httpRequestLengthHistogram = new promClient.Histogram({
  name: 'http_request_length_bytes',
  help: 'Length of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
});
register.registerMetric(httpRequestLengthHistogram);

const httpResponseLengthHistogram = new promClient.Histogram({
  name: 'http_response_length_bytes',
  help: 'Length of HTTP responses in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
});
register.registerMetric(httpResponseLengthHistogram);

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    httpRequestCounter.labels(req.method, req.route.path, res.statusCode).inc();
    httpRequestDurationHistogram
      .labels(req.method, req.route.path, res.statusCode)
      .observe(Date.now() - start);
    httpRequestLengthHistogram.labels(req.method, req.route.path).observe(req.socket.bytesRead);
    httpResponseLengthHistogram.labels(req.method, req.route.path).observe(req.socket.bytesWritten);
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
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
