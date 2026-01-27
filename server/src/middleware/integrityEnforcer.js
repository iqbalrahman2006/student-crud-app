const integrityRegistry = require('../utils/integrityRegistry');

/**
 * SYSTEM INTEGRITY ENFORCER (BACKEND)
 * 
 * Intercepts mutation requests and verifies they match a registered action chain.
 * Blocks any request that does not have a valid technical trace.
 */
const integrityEnforcer = (req, res, next) => {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    if (!isMutation) return next();

    // Find matching registry entry by endpoint (simplified matching)
    const actionEntry = Object.values(integrityRegistry).find(entry => {
        const pattern = entry.endpoint.replace(':id', '[^/]+');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(req.originalUrl) && entry.method === req.method;
    });

    if (!actionEntry) {
        console.error(`INTEGRITY BREACH: Unregistered mutation attempted. [${req.method}] ${req.originalUrl}`);
        return res.status(403).json({
            status: 'fail',
            message: 'SYSTEM INTEGRITY ERROR: Unregistered action trace. Mutation blocked.'
        });
    }

    // Role check (Layer 6 Enforced)
    const userRole = req.headers['x-role'] || 'GUEST';
    if (!actionEntry.rbac.includes(userRole)) {
        console.warn(`RBAC BREACH: User role [${userRole}] attempted [${req.originalUrl}]`);
        return res.status(403).json({
            status: 'fail',
            message: `ACCESS DENIED: Role [${userRole}] cannot perform this action.`
        });
    }

    console.log(`TRACE VERIFIED: [${req.method}] ${req.originalUrl} mapped to ${actionEntry.controller}`);
    next();
};

module.exports = integrityEnforcer;
