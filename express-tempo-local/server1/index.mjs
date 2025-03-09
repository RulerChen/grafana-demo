import express from 'express';
import axios from 'axios';
import { trace, context, propagation } from '@opentelemetry/api';

const app = express();
app.use(express.json());

axios.defaults.baseURL = 'http://server2:8000';

app.get('/api/book/:bookId', async (req, res) => {
  try {
    const headers = {};
    propagation.inject(context.active(), headers);
    const { data } = await axios.get(`/api/book/${req.params.bookId}`, {
      headers
    });
    res.status(200).send(data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).send(error.response.data);
    }
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
    const headers = {};
    propagation.inject(context.active(), headers);
    await axios.post('/api/book', { title }, { headers });
    res.status(201).send('Book created');
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).send(error.response.data);
    }
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.delete('/api/book/:bookId', async (req, res) => {
  try {
    const headers = {};
    propagation.inject(context.active(), headers);
    await axios.delete(`/api/book/${req.params.bookId}`, { headers });
    res.status(204).send('Book deleted');
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).send(error.response.data);
    }
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
