import React from 'react';

/**
 * ACTION GUARD (FE INTEGRITY LAYER)
 * 
 * Verifies that an action is valid, the handler exists, 
 * and the user has sufficient permissions before allowing interaction.
 */
const ActionGuard = ({ actionKey, handler, children, role = 'GUEST' }) => {

    const verifyIntegrity = (e) => {
        if (e && e.preventDefault && e.type === 'submit') e.preventDefault();

        // 1. Mandatory Handler Check
        if (!handler || typeof handler !== 'function') {
            console.error(`INTEGRITY ERROR: Action [${actionKey}] has no valid handler bound.`);
            alert(`SYSTEM ERROR: Action [${actionKey}] is broken (Missing Handler).`);
            if (e && e.stopPropagation) e.stopPropagation();
            return;
        }

        // 2. RBAC Enforcement (Static check)
        const isAdminAction = actionKey.startsWith('STUDENT_') || actionKey.startsWith('BOOK_');
        if (isAdminAction && role !== 'ADMIN') {
            console.warn(`RBAC BREACH: User role [${role}] attempted [${actionKey}]`);
            alert(`ACCESS DENIED: Role [${role}] cannot perform this action.`);
            if (e && e.stopPropagation) e.stopPropagation();
            return;
        }

        // 3. Chain Trace (Simulated)
        console.log(`TRACE: Action [${actionKey}] verified. Executing handler...`);
        handler(e);
    };

    // If student role, we might want to hide it completely or disable it
    if (role === 'STUDENT' && (actionKey.includes('DELETE') || actionKey.includes('UPDATE') || actionKey.includes('ISSUE'))) {
        return null; // Hard Enforce: Zero visibility for students on mutations
    }

    const eventProps = children.type === 'form'
        ? { onSubmit: verifyIntegrity }
        : { onClick: verifyIntegrity };

    return React.cloneElement(children, {
        ...eventProps,
        'data-action-key': actionKey // For automated auditing
    });
};

export default ActionGuard;
