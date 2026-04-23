import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let errorSources: { path: string; message: string }[] = [];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation error";
    errorSources = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));
  }

  if (err.code === "P2002") {
    statusCode = 409;
    message = "Duplicate value error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};