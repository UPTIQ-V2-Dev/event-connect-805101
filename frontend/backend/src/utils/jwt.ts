import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';
import { IUserDocument } from '../models/User';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

class JWTUtils {
    static generateAccessToken(user: IUserDocument): string {
        const payload: TokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        };

        return jwt.sign(payload, config.jwt.secret, {
            expiresIn: config.jwt.accessTokenExpiry
        });
    }

    static generateRefreshToken(user: IUserDocument): string {
        const payload: TokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role
        };

        return jwt.sign(payload, config.jwt.refreshSecret, {
            expiresIn: config.jwt.refreshTokenExpiry
        });
    }

    static async generateTokenPair(user: IUserDocument): Promise<TokenPair> {
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        // Add refresh token to user's token list
        await user.addRefreshToken(refreshToken);

        return {
            accessToken,
            refreshToken
        };
    }

    static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, config.jwt.secret) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid access token');
        }
    }

    static verifyRefreshToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    static generatePasswordResetToken(): string {
        return uuidv4().replace(/-/g, '');
    }

    static generateEmailVerificationToken(): string {
        return uuidv4().replace(/-/g, '');
    }

    static getTokenFromHeader(authHeader: string | undefined): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        return authHeader.split(' ')[1] || null;
    }

    static isTokenExpired(token: string): boolean {
        try {
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.exp) {
                return true;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    static async revokeRefreshToken(user: IUserDocument, token: string): Promise<void> {
        await user.removeRefreshToken(token);
    }

    static async revokeAllRefreshTokens(user: IUserDocument): Promise<void> {
        await user.removeAllRefreshTokens();
    }

    static getTokenExpiry(token: string): Date | null {
        try {
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.exp) {
                return null;
            }

            return new Date(decoded.exp * 1000);
        } catch (error) {
            return null;
        }
    }

    // Utility for cleaning up expired refresh tokens
    static async cleanupExpiredTokens(user: IUserDocument): Promise<void> {
        const validTokens: string[] = [];

        for (const token of user.refreshTokens) {
            if (!this.isTokenExpired(token)) {
                validTokens.push(token);
            }
        }

        if (validTokens.length !== user.refreshTokens.length) {
            user.refreshTokens = validTokens;
            await user.save();
        }
    }

    // Utility for limiting the number of refresh tokens per user
    static async limitRefreshTokens(user: IUserDocument): Promise<void> {
        if (user.refreshTokens.length > config.security.maxRefreshTokens) {
            // Remove oldest tokens, keeping only the most recent ones
            user.refreshTokens = user.refreshTokens.slice(-config.security.maxRefreshTokens);
            await user.save();
        }
    }
}

export default JWTUtils;
