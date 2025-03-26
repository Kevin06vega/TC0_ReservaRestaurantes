import { pool } from './db.js'
import bcrypt from 'bcryptjs'
import { SALT_ROUNDS_INT } from './config.js'

export class UserRepository {
  static async create({ username, password, role }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS_INT)

    const result = await pool.query(
      'SELECT register_user($1, $2, $3) AS id',
      [username, hashedPassword, role]
    )

    return result.rows[0].id
  }

  static async login({ username, password }) {
    const result = await pool.query(
      'SELECT * FROM "User" WHERE username = $1',
      [username]
    )
    const user = result.rows[0]

    if (!user) throw new Error('username does not exist')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('password is invalid')

    const { password: _, ...publicUser } = user
    return publicUser
  }

  static async update({ id, username, password, role }) {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS_INT)

    const result = await pool.query(
      'SELECT update_user($1, $2, $3, $4)',
      [id, username, hashedPassword, role]
    )

    return result.rows[0]
  }


  static async deleteById(id) {
    const result = await pool.query('SELECT delete_user($1)', [id])
    return result
  }
  


}
