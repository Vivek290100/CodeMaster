import axios from 'axios';
import { Request, Response } from 'express';

export const setupPistonCheckRoute = (app: any) => {
  app.get('/api/piston/check', async (req: Request, res: Response) => {
    try {
      const response = await axios.get('https://emkc.org/api/v2/piston/runtimes');
      res.json({ status: 'ok', runtimes: response.data });
    } catch (error) {
      res.status(500).json({ status: 'error', message: 'Failed to connect to Piston API' });
    }
  });
};