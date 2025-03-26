import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'

export function verifyToken(req, res, next) {
  const token = req.cookies.access_token
  if (!token) return res.status(403).json({ message: 'Token faltante' })

  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' })
  }
}
