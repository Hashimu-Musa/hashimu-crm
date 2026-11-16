const ALL_PERMISSIONS = [
  "companies:read",
  "companies:create",
  "companies:update",
  "companies:delete",
  "contacts:read",
  "contacts:create",
  "contacts:update",
  "contacts:delete",
  "deals:read",
  "deals:create",
  "deals:update",
  "deals:delete",
];

const ROLE_PERMISSIONS = {
  OWNER: ALL_PERMISSIONS,
  ADMIN: ALL_PERMISSIONS,
  SALES_MANAGER: [
    "companies:read",
    "companies:create",
    "companies:update",
    "companies:delete",
    "contacts:read",
    "contacts:create",
    "contacts:update",
    "contacts:delete",
    "deals:read",
    "deals:create",
    "deals:update",
    "deals:delete",
  ],
  SALES_REP: [
    "companies:read",
    "companies:create",
    "companies:update",
    "contacts:read",
    "contacts:create",
    "contacts:update",
    "deals:read",
    "deals:create",
    "deals:update",
  ],
  VIEWER: [
    "companies:read",
    "contacts:read",
    "deals:read",
  ],
};

export function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const allowed = requiredPermissions.every((permission) =>
      hasPermission(req.user.role, permission),
    );

    if (!allowed) {
      return res.status(403).json({
        error: "You do not have permission to perform this action",
        requiredPermissions,
      });
    }

    next();
  };
}

export function permissionsForRole(role) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function listPermissions() {
  return [...ALL_PERMISSIONS];
}
