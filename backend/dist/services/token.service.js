import prisma from "../client.js";
import config from "../config/config.js";
import { TokenType } from '../generated/prisma/index.js';
import ApiError from "../utils/ApiError.js";
import userService from "./user.service.js";
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import moment from 'moment';
/**
 * Generate token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
    const payload = {
        sub: userId,
        iat: moment().unix(),
        exp: expires.unix(),
        type
    };
    return jwt.sign(payload, secret);
};
/**
 * Save a token
 * @param {string} token
 * @param {number} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (token, userId, expires, type, blacklisted = false) => {
    const createdToken = await prisma.token.create({
        data: {
            token,
            userId: userId,
            expires: expires.toDate(),
            type,
            blacklisted
        }
    });
    return createdToken;
};
/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */
const verifyToken = async (token, type) => {
    const payload = jwt.verify(token, config.jwt.secret);
    const userId = Number(payload.sub);
    const tokenData = await prisma.token.findFirst({
        where: { token, type, userId, blacklisted: false }
    });
    if (!tokenData) {
        throw new Error('Token not found');
    }
    return tokenData;
};
/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<AuthTokensResponse>}
 */
const generateAuthTokens = async (user) => {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = generateToken(user.id, accessTokenExpires, TokenType.ACCESS);
    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = generateToken(user.id, refreshTokenExpires, TokenType.REFRESH);
    await saveToken(refreshToken, user.id, refreshTokenExpires, TokenType.REFRESH);
    return {
        access: {
            token: accessToken,
            expires: accessTokenExpires.toDate()
        },
        refresh: {
            token: refreshToken,
            expires: refreshTokenExpires.toDate()
        }
    };
};
/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
const generateResetPasswordToken = async (email) => {
    const user = await userService.getUserByEmail(email);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'No users found with this email');
    }
    const expires = moment().add(config.jwt.resetPasswordExpirationMinutes, 'minutes');
    const resetPasswordToken = generateToken(user.id, expires, TokenType.RESET_PASSWORD);
    await saveToken(resetPasswordToken, user.id, expires, TokenType.RESET_PASSWORD);
    return resetPasswordToken;
};
/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
const generateVerifyEmailToken = async (user) => {
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = generateToken(user.id, expires, TokenType.VERIFY_EMAIL);
    await saveToken(verifyEmailToken, user.id, expires, TokenType.VERIFY_EMAIL);
    return verifyEmailToken;
};
export default {
    generateToken,
    saveToken,
    verifyToken,
    generateAuthTokens,
    generateResetPasswordToken,
    generateVerifyEmailToken
};
