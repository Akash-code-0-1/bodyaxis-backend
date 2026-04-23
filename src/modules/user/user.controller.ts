import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchAsync } from "../../core/utils/catchAsync";
import { sendResponse } from "../../core/utils/sendResponse";
import { userService } from "./user.service";

const getUsers = catchAsync(async (_req: Request, res: Response) => {
  const result = await userService.getAllUsers();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Users fetched successfully",
    data: result,
  });
});

const getUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getSingleUser(String(req.params.id));

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "User fetched successfully",
    data: result,
  });
});

export const userController = {
  getUsers,
  getUser,
};