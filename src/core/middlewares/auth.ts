import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export const auth =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const token = authorization.split(" ")[1];

    try {
      const decoded = verifyAccessToken(token) as {
        userId: string;
        role: string;
      };

      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden",
        });
      }

      next();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  };