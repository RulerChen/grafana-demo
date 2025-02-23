import express from 'express';
import logger from './logger.mjs';

const app = express();

app.use((req, res, next) => {
  logger.info({
    message: `Request received endpoint=${req.url}`,
    url: req.url,
    method: req.method
  });
  next();
});

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!');
});

app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
