import prisma from "../client.js";
import { TokenType } from '../generated/prisma/index.js';
import config from "./config.js";
import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
const jwtOptions = {
    secretOrKey: config.jwt.secret,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
};
const jwtVerify = async (payload, done) => {
    try {
        if (payload.type !== TokenType.ACCESS) {
            throw new Error('Invalid token type');
        }
        const user = await prisma.user.findUnique({
            select: {
                id: true,
                email: true,
                name: true,
                role: true
            },
            where: { id: payload.sub }
        });
        if (!user) {
            return done(null, false);
        }
        done(null, user);
    }
    catch (error) {
        done(error, false);
    }
};
export const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);
