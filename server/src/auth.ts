import { Request, Response, NextFunction, RequestHandler } from 'express';
import passport from 'passport';
import passportLocal from 'passport-local';

import { userRepository } from 'src/repository/user';

const LocalStrategy = passportLocal.Strategy;

export const requireUserAuthentication = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.isAuthenticated()) {
        res.redirect(401, '/#login');
    } else {
        next();
    }
};

export const onlyForAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (typeof req.user !== 'number') {
        res.status(401).send();
    } else {
        const user = await userRepository.findOne({ id: req.user });

        if (!user.admin) {
            res.status(401).send();
        } else {
            next();
        }
    }
};

passport.serializeUser(function (user: Express.User, done) {
    done(null, user);
});

passport.deserializeUser((id: number, done) => {
    try {
        const user = id;
        if (!user) {
            return done(null, null);
        }
        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
});

passport.use(
    new LocalStrategy(
        {
            usernameField: 'username',
            passwordField: 'password',
        },
        async (username, password, done) => {
            try {
                const user = await userRepository.findOneWithPassword({
                    name: username,
                });
                if (user) {
                    if (await userRepository.verifyPassword(user, password)) {
                        return done(null, user.id);
                    }
                }
                return done(null, false, {
                    message: 'Incorrect username or password',
                });
            } catch (error) {
                return done(error);
            }
        }
    )
);

export const localAuthentication: RequestHandler =
    passport.authenticate('local');
