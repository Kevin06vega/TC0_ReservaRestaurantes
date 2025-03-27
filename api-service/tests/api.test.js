import request from 'supertest'
import jwt from 'jsonwebtoken'

const SECRET = "e73945fc30145b9c3c0b1d8a4f83cf716f65df187fc402fbdaf8cf5c81a8c46c05151dcb8a457f3536e712d27528599eaf90c5c6ec4d56ea2de6e1c162c7a5f8"
const apiURL = 'http://localhost:3001'

// Crear un token válido manualmente para pruebas
const testUser = { id: 1, username: 'testuser', role: 'admin' }
const token = jwt.sign(testUser, SECRET)

const agent = request.agent(apiURL)

const authHeader = { Cookie: `access_token=${token}` }

// Pruebas API Service

describe('API Service', () => {
  it('✅ POST /restaurants - debe crear un restaurante', async () => {
    const res = await agent
      .post('/restaurants')
      .set(authHeader)
      .send({
        name: 'Restaurante Test',
        capacity: 20,
        location: 'Cartago',
        table_count: 5
      })

    if (res.status !== 201) {
      console.error(res.body)
      throw new Error('No se pudo registrar el restaurante')
    }
  })

  it('✅ GET /restaurants - debe listar restaurantes', async () => {
    const res = await agent.get('/restaurants').set(authHeader)

    if (!Array.isArray(res.body)) {
      throw new Error('La respuesta no es una lista de restaurantes')
    }
  })

  it('✅ POST /menus - debe crear un menú', async () => {
    const res = await agent.post('/menus').set(authHeader).send({
      name: 'Menú Test',
      id_restaurant: 1
    })

    if (res.status !== 201 || !res.body.id) {
      console.error(res.body)
      throw new Error('No se pudo crear el menú')
    }
  })

  it('✅ GET /menus/:id - debe obtener un menú por ID', async () => {
    const res = await agent.get('/menus/1').set(authHeader)
    if (!res.body || !res.body.name) {
      console.error(res.body)
      throw new Error('Menú no encontrado')
    }
  })

  it('✅ PUT /menus/:id - debe actualizar un menú', async () => {
    const res = await agent.put('/menus/1').set(authHeader).send({
      name: 'Menú Actualizado',
      id_restaurant: 1
    })

    if (!res.body || res.body.name !== 'Menú Actualizado') {
      throw new Error('No se actualizó el menú')
    }
  })



  it('✅ POST /reservations - debe crear una reserva', async () => {
    const res = await agent.post('/reservations').set(authHeader).send({
      id_table: 1,
      reservation_time: '2025-03-28T18:00:00'
    })

    if (!res.body.id) {
      console.error(res.body)
      throw new Error('No se pudo crear la reserva')
    }
  })


  it('✅ DELETE /menus/:id - debe eliminar un menú', async () => {
    const res = await agent.delete('/menus/1').set(authHeader)
    if (!res.body.message) {
      throw new Error('No se eliminó el menú')
    }
  })




  it('✅ DELETE /reservations/:id - debe cancelar la reserva', async () => {
    const res = await agent.delete('/reservations/1').set(authHeader)
    if (!res.body.message) {
      throw new Error('No se canceló la reserva')
    }
  })

  it('✅ POST /orders - debe crear una orden', async () => {
    const res = await agent.post('/orders').set(authHeader).send({ total: 2500 })
    if (!res.body.id) {
      throw new Error('No se pudo crear la orden')
    }
  })

  it('✅ GET /orders/:id - debe obtener detalles de una orden', async () => {
    const res = await agent.get('/orders/1').set(authHeader)
    if (!res.body || !res.body.id) {
      throw new Error('No se encontraron detalles de la orden')
    }
  })
})
