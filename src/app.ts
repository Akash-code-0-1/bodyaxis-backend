import express from 'express';
import cors from 'cors';
import router from './routes';
import { globalErrorHandler } from './core/middlewares/globalErrorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', router);

app.get('/health', (_req, res) => {
  res.json({ message: 'Server running 🚀' });
});

app.use(globalErrorHandler);

export default app;