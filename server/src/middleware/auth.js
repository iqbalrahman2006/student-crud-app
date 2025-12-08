const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');

// Protect routes - user must be logged in
exports.protect = async (req, res, next) => {
    try {
        let token;
        
        // 1) Get token and check if it exists
        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies.jwt) {
            token = req.cookies.jwt;
        }

        if (!token) {
            return next(
                new AppError('You are not logged in! Please log in to get access.', 401)
            );
        }

        // 2) Verify token
        const decoded = await jwt.verify(token, process.env.JWT_SECRET);

        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return next(
                new AppError('The user belonging to this token no longer exists.', 401)
            );
        }

        // 4) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
            return next(
                new AppError('User recently changed password! Please log in again.', 401)
            );
        }

        // GRANT ACCESS TO PROTECTED ROUTE
        req.user = currentUser;
        res.locals.user = currentUser;
        next();
    } catch (err) {
        return next(new AppError('Invalid token or session expired', 401));
    }
};

// Restrict access to certain roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // roles ['admin', 'teacher']. role='user'
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

// Only for rendered pages, no errors!
exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            // 1) Verify token
            const decoded = await jwt.verify(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            // 2) Check if user still exists
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3) Check if user changed password after the token was issued
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // THERE IS A LOGGED IN USER
            res.locals.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
};
