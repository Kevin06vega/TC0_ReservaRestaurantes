import express from 'express'
import jwt from 'jsonwebtoken'
import { PORT, SECRET_JWT_KEY } from './config.js'
import { UserRepository } from './user-repository.js'
import cookieParser from 'cookie-parser'
import { verifyToken } from './middlewares/verifyToken.js'
import { pool } from './db.js'


const app = express()
app.use(express.json())
app.use(cookieParser())

// Middleware opcional para tener req.session.user
app.use((req, res, next) => {
  const token = req.cookies.access_token
  req.session = { user: null }

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY)
    req.session.user = data
  } catch (error) {
    // no hacer nada si es inválido
  }

  next()
})

// Ruta principal (puede responder algo si querés)
app.get('/', (req, res) => {
  const { user } = req.session
  res.json({ message: 'API Auth', user })
})

// LOGIN
app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body

  try {
    const user = await UserRepository.login({ username, password })

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      SECRET_JWT_KEY,
      { expiresIn: '1h' }
    )

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60
      })
      .send({ user, token })
  } catch (error) {
    res.status(401).send({ error: error.message })
  }
})
// REGISTER
app.post('/auth/register', async (req, res) => {
  const { username, password, role } = req.body

  try {
    const id = await UserRepository.create({ username, password, role })
    res.status(201).json({ id })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})


app.get('/users/me', verifyToken, async (req, res) => {
  const userId = req.user.id

  try {
    const result = await pool.query('SELECT * FROM "User" WHERE id = $1', [userId])
    const user = result.rows[0]

    if (!user) return res.status(404).json({ message: 'User not found' })

    // Quitamos el password
    const { password, ...userData } = user

    res.json(userData)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  }
})


app.put('/users/:id', verifyToken, async (req, res) => {
  const id = Number(req.params.id)
  const { username, password, role } = req.body

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Faltan datos requeridos' })
  }

  try {
    const result = await UserRepository.update({ id, username, password, role })
    res.json({ message: result.update_user })
  } catch (error) {
    console.error('❌ Error al actualizar usuario:', error.message)
    res.status(500).json({ error: error.message })
  }
})




app.delete('/users/:id', async (req, res) => {
  const { id } = req.params

  try {
    await UserRepository.deleteById(id)
    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error.message)
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
})







// LOGOUT
app.post('/logout', (req, res) => {
  res.clearCookie('access_token').json({ message: 'Logout successful' })
})

// RUTA PROTEGIDA
app.get('/protected', verifyToken, (req, res) => {
  res.json({ message: 'Ruta protegida', user: req.user })
})

// SERVIDOR
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
