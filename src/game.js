const { GOAL, COUNTDOWN_SECONDS, MAX_CLICKS_PER_SECOND, MIN_PLAYERS } = require('./constants')
const { publicRoom } = require('./rooms')

function emitRoom(io, room) {
  io.to(room.code).emit('room', publicRoom(room))
}

function startCountdown(io, room) {
  let n = COUNTDOWN_SECONDS
  io.to(room.code).emit('countdown', n)
  room.timer = setInterval(() => {
    n--
    if (n > 0) return io.to(room.code).emit('countdown', n)
    clearInterval(room.timer)
    room.timer = null
    room.status = 'racing'
    emitRoom(io, room)
    io.to(room.code).emit('go')
  }, 1000)
}

function finish(io, room) {
  room.status = 'finished'
  room.ranking = [...room.players.entries()]
    .map(([id, p]) => ({ id, name: p.name, lane: p.lane, position: p.position }))
    .sort((a, b) => b.position - a.position)
  emitRoom(io, room)
}

function click(io, room, socketId) {
  if (room.status !== 'racing') return
  const player = room.players.get(socketId)
  if (!player) return
  const now = Date.now()
  player.clicks = player.clicks.filter((t) => now - t < 1000)
  if (player.clicks.length >= MAX_CLICKS_PER_SECOND) return
  player.clicks.push(now)
  player.position++
  if (player.position >= GOAL) return finish(io, room)
  io.to(room.code).emit('state', [...room.players.entries()].map(([id, p]) => ({ id, position: p.position })))
}

function afterLeave(io, room) {
  if (room.players.size < MIN_PLAYERS) {
    if (room.status === 'countdown') {
      clearInterval(room.timer)
      room.timer = null
      room.status = 'lobby'
    } else if (room.status === 'racing') {
      return finish(io, room)
    }
  }
  emitRoom(io, room)
}

module.exports = { startCountdown, click, afterLeave }