import { Response } from "express";

interface IResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export const sendResponse = <T>(res: Response, payload: IResponse<T>) => {
  res.status(payload.statusCode).json(payload);
};