import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../core/middlewares/auth";

const router = Router();

router.get("/", auth("ADMIN"), userController.getUsers);
router.get("/:id", auth("ADMIN", "USER", "TRAINER"), userController.getUser);

export const userRoutes = router;