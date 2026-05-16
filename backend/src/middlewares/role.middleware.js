// Middleware para validar roles
export const requireRole = (...rolesPermitidos) => {

  return (req, res, next) => {

    // req.user viene del middleware de auth
    if (!rolesPermitidos.includes(req.user.tipo_usuario)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN'
      });
    }

    next();
  };
};