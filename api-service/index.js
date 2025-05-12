import express from 'express'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import { pool } from './db.js'
 
 
const app = express()
const PORT = process.env.PORT || 3001
const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY || 'mysecretkey'
 
app.use(express.json())
app.use(cookieParser())
 
// Middleware para verificar token
function verifyToken(req, res, next) {
    const token = req.cookies.access_token
    console.log('🧪 Token recibido:', token) // <--- agregar esto
 
    if (!token) return res.status(403).json({ message: 'No token provided' })
 
    try {
      const decoded = jwt.verify(token, SECRET_JWT_KEY)
      req.user = decoded
      next()
    } catch (err) {
      console.error('❌ Error al verificar token:', err.message) // <--- y esto
      return res.status(401).json({ message: 'Invalid token' })
    }
  }
 
 
 
 
 
  app.post('/restaurants', verifyToken, async (req, res) => {
    const { name, capacity, location, table_count } = req.body;
 
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo los administradores pueden registrar restaurantes' });
    }
 
    try {
      const result = await pool.query(
        'SELECT register_restaurant($1, $2, $3, $4) AS id',
        [name, capacity, location, table_count]
      );
      res.status(201).json({ id: result.rows[0].id });
    } catch (error) {
      console.error('❌ Error al registrar restaurante:', error.message);
      res.status(500).json({ error: 'Error al registrar restaurante' });
    }
  });
 
 
 
 
 
  // GET /restaurants - listar todos los restaurantes
app.get('/restaurants', verifyToken, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM list_restaurants()')
      res.json(result.rows)
    } catch (error) {
      console.error('❌ Error listing restaurants:', error.message)
      res.status(500).json({ error: 'Error al obtener los restaurantes' })
    }
  })
 
 
 
 
 
  app.post('/menus', verifyToken, async (req, res) => {
    const { name, id_restaurant } = req.body
    try {
      const result = await pool.query(
        'SELECT create_menu($1, $2) AS id',
        [name, id_restaurant]
      )
      res.status(201).json({ id: result.rows[0].id })
    } catch (error) {
      console.error('❌ Error creating menu:', error.message)
      res.status(500).json({ error: 'Error creating menu' })
    }
  })
 
 
 
 
  app.get('/menus/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
 
    try {
      const result = await pool.query('SELECT * FROM get_menu_by_id($1)', [id]);
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error fetching menu:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  })
 
 
 
  app.put('/menus/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, id_restaurant } = req.body;
 
    try {
      const result = await pool.query(
        'UPDATE "Menu" SET name = $1, id_restaurant = $2 WHERE id = $3 RETURNING *',
        [name, id_restaurant, id]
      );
 
      if (result.rowCount === 0) return res.status(404).json({ error: 'Menú no encontrado' });
      res.json(result.rows[0]);
    } catch (error) {
      console.error('❌ Error actualizando menú:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
 
 
 
  app.delete('/menus/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
 
    try {
      const result = await pool.query('DELETE FROM "Menu" WHERE id = $1 RETURNING *', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'Menú no encontrado' });
 
      res.json({ message: 'Menú eliminado correctamente' });
    } catch (error) {
      console.error('❌ Error eliminando menú:', error.message);
      res.status(500).json({ error: error.message });
    }
  });
 
// Crear una nueva reserva
app.post('/reservations', verifyToken, async (req, res) => {
    const { id_table, reservation_time } = req.body
    const id_user = req.user.id
 
    try {
      const result = await pool.query(
        'SELECT create_reservation($1, $2, $3) AS id',
        [id_user, id_table, reservation_time]
      )
      res.status(201).json({ id: result.rows[0].id })
    } catch (error) {
      console.error('❌ Error al crear reserva:', error.message)
      res.status(400).json({ error: error.message })
    }
  })
 
  // Cancelar una reserva
  app.delete('/reservations/:id', verifyToken, async (req, res) => {
    const { id } = req.params
 
    try {
      const result = await pool.query('SELECT cancel_reservation($1) AS message', [id])
      res.json({ message: result.rows[0].message })
    } catch (error) {
      console.error('❌ Error al cancelar reserva:', error.message)
      res.status(500).json({ error: error.message })
    }
  })
 
 
 
// Crear una nueva orden
app.post('/orders', verifyToken, async (req, res) => {
    const id_user = req.user.id
    const { total } = req.body
 
    try {
      const result = await pool.query('SELECT create_order($1, $2) AS id', [id_user, total])
      res.status(201).json({ id: result.rows[0].id })
    } catch (error) {
      console.error('❌ Error al crear orden:', error.message)
      res.status(400).json({ error: error.message })
    }
  })
 
  // Obtener detalles de una orden
  app.get('/orders/:id', verifyToken, async (req, res) => {
    const { id } = req.params
 
    try {
      const result = await pool.query('SELECT * FROM get_order_details($1)', [id])
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Orden no encontrada' })
      }
      res.json(result.rows[0])
    } catch (error) {
      console.error('❌ Error al obtener detalles de la orden:', error.message)
      res.status(500).json({ error: error.message })
    }
  })
 
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }