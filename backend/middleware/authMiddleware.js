const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !/^Bearer\s+\S+$/.test(authorization)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authorization.split(/\s+/)[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};