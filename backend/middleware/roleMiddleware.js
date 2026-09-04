const VALID_ROLES = new Set(['CUSTOMER', 'STAFF', 'ADMIN']);

function authorizeRoles(...allowedRoles) {
  const rolesAreValid =
    allowedRoles.length > 0 &&
    allowedRoles.every((role) => VALID_ROLES.has(role));

  return function roleMiddleware(req, res, next) {
    if (!rolesAreValid) {
      return res.status(500).json({
        success: false,
        message: 'Role authorization is not configured',
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    return next();
  };
}

module.exports = authorizeRoles;