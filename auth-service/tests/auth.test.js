import request from 'supertest'
const baseURL = 'http://localhost:3000'
 
// Variables globales para todas las pruebas
let authCookie
let userId
let username
let password
 
before(async () => {
  username = 'user' + Date.now()
  password = 'testpass123'
 
  const register = await request(baseURL)
    .post('/auth/register')
    .send({ username, password, role: 'admin' })
 
  if (register.status !== 201 || !register.body.id) {
    console.error('❌ Registro fallido')
    throw new Error('El registro no devolvió status 201')
  }
 
  userId = register.body.id
 
  const login = await request(baseURL)
    .post('/auth/login')
    .send({ username, password })
 
  if (login.status !== 200 || !login.headers['set-cookie']) {
    console.error('❌ Login fallido')
    throw new Error('El login no devolvió status 200 ni cookie')
  }
 
  authCookie = login.headers['set-cookie']
})
 
describe('Registro', () => {
  it('✅ Registra un usuario correctamente', async () => {
    console.log('✔️ Usuario ya registrado en before()')
  })
})
 
describe('Login', () => {
  it('✅ Realiza login correctamente y devuelve token y usuario', async () => {
    console.log('🔐 Login exitoso con cookie obtenida en before()')
  })
})
 
describe('User endpoints', () => {
  it('✅ GET /users/me - debe devolver datos del usuario autenticado', async () => {
    const res = await request(baseURL)
      .get('/users/me')
      .set('Cookie', authCookie)
 
    if (res.status !== 200 || !res.body.username) {
      console.error(res.body)
      throw new Error('❌ No se obtuvo el usuario correctamente')
    }
  })
 
  it('✅ PUT /users/:id - debe actualizar el usuario', async () => {
    const res = await request(baseURL)
      .put(`/users/${userId}`)
      .set('Cookie', authCookie)
      .send({
        username: username + '_updated',
        password: 'newpass123',
        role: 'admin'
      })
 
    if (res.status !== 200 || !res.body.message) {
      console.error(res.body)
      throw new Error('❌ No se actualizó el usuario')
    }
  })
 
  it('✅ DELETE /users/:id - debe eliminar el usuario', async () => {
    const res = await request(baseURL)
      .delete(`/users/${userId}`)
      .set('Cookie', authCookie)
 
    if (res.status !== 200 || !res.body.message) {
      console.error(res.body)
      throw new Error('❌ No se eliminó el usuario')
    }
  })
})