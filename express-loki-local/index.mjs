import express from 'express';
import logger from './logger.mjs';

const app = express();

app.use((req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 400) {
      logger.error({
        message: `msg="Received response" method=${req.method} path=${req.route.path} ip=${req.ip} status=${res.statusCode} url=${req.originalUrl}`
      });
    } else {
      logger.info({
        message: `msg="Received response" method=${req.method} path=${req.route.path} ip=${req.ip} status=${res.statusCode} url=${req.originalUrl}`
      });
    }
  });
  next();
});

app.get('/api', (req, res) => {
  if (Math.random() < 0.1) {
    return res.status(500).send('Internal server error');
  }
  res.status(200).send('Hello, world!');
});

app.get('/api/random', (req, res) => {
  if (Math.random() < 0.1) {
    return res.status(400).send('Bad request');
  }
  res.status(200).send(Math.random().toString());
});

app.get('/api/book/:bookId', (req, res) => {
  if (Math.random() < 0.1) {
    return res.status(404).send('Book not found');
  }
  res.status(200).send(`Book ID: ${req.params.bookId}`);
});

app.post('/api/book', (req, res) => {
  if (Math.random() < 0.1) {
    return res.status(500).send('Internal server error');
  }
  res.status(201).send('Book created');
});

app.put('/api/book/:bookId', (req, res) => {
  if (Math.random() < 0.1) {
    return res.status(500).send('Internal server error');
  }
  res.status(200).send(`Book ID: ${req.params.bookId} updated`);
});

app.delete('/api/book/:bookId', (req, res) => {
  if (Math.random() < 0.1) {
    return res.status(500).send('Internal server error');
  }
  res.status(204).send();
});

app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
