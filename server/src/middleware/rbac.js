const ensureLibraryRole = (allowedRoles) => {
    return (req, res, next) => {
        // STRICT RBAC: Expect 'x-role' header only.
        // In full enterprise implementation, this would be a JWT verified role.
        const userRole = req.headers['x-role'] || 'GUEST';

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            console.warn(`AUTH FAILURE: Attempted ${req.method} on ${req.originalUrl} with role [${userRole}]. Required: ${allowedRoles.join(', ')}`);
            return res.status(403).json({
                status: 'fail',
                message: `Access Denied. Insufficient permissions for role: ${userRole}`
            });
        }
    };
};

module.exports = ensureLibraryRole;
