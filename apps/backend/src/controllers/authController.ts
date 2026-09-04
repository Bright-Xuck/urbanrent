import type { Request, Response } from "express";
import { registerUser, loginUser, refreshAccessToken, logoutUser } from "../services/userService.js";

// ============================================================
// AUTH CONTROLLER
// ============================================================
// This layer handles HTTP requests/responses.
// It extracts data from the request, calls the service layer,
// and formats the response. It does NOT contain business logic.
// ============================================================

// ============================================================
// REGISTER
// ============================================================
// POST /api/auth/register
// Body: { email, password }
// ============================================================
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

// ============================================================
// LOGIN
// ============================================================
// POST /api/auth/login
// Body: { email, password }
// Returns: { user, accessToken, refreshToken }
// ============================================================
export async function Login(req: Request, res: Response) {
    const { email, password } = req.body;

    try {
        const { user, accessToken, refreshToken } = await loginUser({
            email,
            password,
        });

        // Set the cookie BEFORE res.json() — once the response body is
        // flushed, the Set-Cookie header can no longer be added.
        res.cookie("RefreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            path: "/api/auth",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            accessToken
        });
    } catch (error) {
        if (error instanceof Error && error.message === "Invalid email or password") {
            res.status(401).json({ message: error.message });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    }
}

// ============================================================
// REFRESH
// ============================================================
// POST /api/auth/refresh
// Body: { refreshToken }
// Returns: { accessToken, user }
// Called when the access token has expired. The client sends the
// refresh token, and we issue a new access token.
// ============================================================
export async function Refresh(req: Request, res: Response) {
    const  refreshToken  = req.cookies.RefreshToken;

    // If no refresh token was provided, reject.
    if (!refreshToken) {
        res.status(400).json({ message: "Refresh token is required" });
        return;
    }

    try {
        const { accessToken } = await refreshAccessToken(refreshToken);

        res.status(200).json({
            message: "Token refreshed successfully",
            accessToken
        });
    } catch (error) {
        // All refresh errors (invalid, revoked, expired) return 401.
        if (error instanceof Error) {
            res.status(401).json({ message: error.message });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    }
}

// ============================================================
// LOGOUT
// ============================================================
// POST /api/auth/logout
// Body: { refreshToken }
// Revokes the session so the refresh token can no longer be used.
// ============================================================
export async function Logout(req: Request, res: Response) {
    const  refreshToken  = req.cookies.RefreshToken;

    // If no refresh token was provided, reject.
    if (!refreshToken) {
        res.status(400).json({ message: "Refresh token is required" });
        return;
    }

    try {
        await logoutUser(refreshToken);

        // Clear the cookie BEFORE res.json() — clearCookie sets a header,
        // and once json() flushes the response that header is dropped.
        // path + secure must match how the cookie was set, or the browser
        // ignores the deletion.
        res.clearCookie("RefreshToken", {
            path: "/api/auth",
            secure: true,
        });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        if (error instanceof Error && error.message === "Invalid refresh token") {
            res.status(401).json({ message: error.message });
            return;
        }

        res.status(500).json({ message: "Internal server error" });
    }
}