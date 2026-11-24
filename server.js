const path = require('path')
const http = require('http')
const express = require('express')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.static(path.join(__dirname, 'public')))
app.get('/api/health', (req, res) => res.json({ ok: true }))

io.on('connection', (socket) => {
  console.log('[IO] connected', socket.id)
  socket.on('disconnect', () => console.log('[IO] disconnected', socket.id))
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => console.log('Server on port ' + PORT))