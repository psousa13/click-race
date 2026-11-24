const path = require('path')
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')
const rooms = require('./src/rooms')
const game = require('./src/game')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(path.join(__dirname, 'public')))
app.get('/api/health', (req, res) => res.json({ ok: true }))

io.on('connection', (socket) => {
  console.log('[IO] connected', socket.id)

  const broadcast = (room) => io.to(room.code).emit('room', rooms.publicRoom(room))
  const reply = (cb, result) => { if (typeof cb === 'function') cb(result) }

  socket.on('createRoom', (data, cb) => {
    const d = data || {}
    if (rooms.findBySocket(socket.id)) return reply(cb, { error: 'Já estás numa sala.' })
    const result = rooms.createRoom(socket.id, d.name)
    if (result.error) return reply(cb, result)
    socket.join(result.room.code)
    reply(cb, { ok: true })
    broadcast(result.room)
  })

  socket.on('joinRoom', (data, cb) => {
    const d = data || {}
    if (rooms.findBySocket(socket.id)) return reply(cb, { error: 'Já estás numa sala.' })
    const result = rooms.joinRoom(socket.id, d.name, d.code)
    if (result.error) return reply(cb, result)
    socket.join(result.room.code)
    reply(cb, { ok: true })
    broadcast(result.room)
  })

  socket.on('start', (data, cb) => {
    const result = rooms.start(socket.id)
    if (result.error) return reply(cb, result)
    reply(cb, { ok: true })
    broadcast(result.room)
    game.startCountdown(io, result.room)
  })

  socket.on('click', () => {
    const room = rooms.findBySocket(socket.id)
    if (room) game.click(io, room, socket.id)
  })

  socket.on('playAgain', (data, cb) => {
    const result = rooms.reset(socket.id)
    if (result.error) return reply(cb, result)
    reply(cb, { ok: true })
    broadcast(result.room)
  })

  socket.on('leaveRoom', (data, cb) => {
    const room = rooms.findBySocket(socket.id)
    if (room) {
      socket.leave(room.code)
      const remaining = rooms.leave(socket.id)
      if (remaining) game.afterLeave(io, remaining)
    }
    reply(cb, { ok: true })
  })

  socket.on('disconnect', () => {
    console.log('[IO] disconnected', socket.id)
    const remaining = rooms.leave(socket.id)
    if (remaining) game.afterLeave(io, remaining)
  })
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log('Server on port ' + PORT))