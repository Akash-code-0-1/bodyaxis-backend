import { Router } from "express";
import { authController } from "./auth.controller";
import { validateRequest } from "../../core/middlewares/validateRequest";
import { loginSchema, registerSchema } from "./auth.validation";

const router = Router();

router.post("/register", validateRequest(registerSchema), authController.register);
router.post("/login", validateRequest(loginSchema), authController.login);

export const authRoutes = router;