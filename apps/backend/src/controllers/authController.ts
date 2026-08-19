import type { Request, Response } from "express";
import { registerUser } from "../services/userService.js";

export async function Register(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
        const user = await registerUser({
            email,
            password,
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "User with this email already exists") {
            res.status(409).json({ message: error.message });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    }
}