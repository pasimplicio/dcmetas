const adminAuth = (req, res, next) => {
  const expected = process.env.API_ADMIN_TOKEN;

  // Se não há token configurado, passa direto (modo desenvolvimento)
  if (!expected) return next();

  const token = req.headers['x-admin-token'];
  if (token !== expected) {
    return res.status(403).json({ error: 'Acesso não autorizado. Token administrativo inválido.' });
  }
  next();
};

export default adminAuth;
