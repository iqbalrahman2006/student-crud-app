# CRITICAL DIRECTORIES MAP

The following directories are considered **CORE** and are locked for direct modification:

| Directory | Role | Risk Level |
| :--- | :--- | :--- |
| `client/src/` | Primary Frontend Source | **CRITICAL** |
| `server/src/` | Primary Backend Source | **CRITICAL** |
| `server/src/models/` | Database Schemas | **EXTREME** |
| `server/src/controllers/` | Business Logic | **EXTREME** |
| `server/src/routes/` | API Entry Points | **HIGH** |
| `client/src/context/` | Global State Management | **HIGH** |
| `client/src/pages/` | Core Application Views | **HIGH** |
| `server/src/middleware/` | Security & RBAC | **HIGH** |

### Safety Zones (Safe to Extend):
- `client/src/components/extensions/` (New UI components)
- `server/src/utils/extra/` (Helper functions)
- `server/src/scripts/` (Disposable automation scripts)
