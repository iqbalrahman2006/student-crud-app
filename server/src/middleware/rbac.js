const ensureLibraryRole = (allowedRoles) => {
    return (req, res, next) => {
        // Mock Auth: Expect 'x-role' header or 'role' in body/query for now.
        // In PROD: req.user.role from JWT
        const userRole = req.headers['x-role'] || req.body.role || 'GUEST';

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            return res.status(403).json({ status: 'fail', message: `Access Denied. Required: ${allowedRoles.join(', ')}` });
        }
    };
};

module.exports = ensureLibraryRole;
