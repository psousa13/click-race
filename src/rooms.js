const { MIN_PLAYERS, MAX_PLAYERS, CODE_LENGTH, GOAL } = require('./constants')

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const rooms = new Map()

function newCode() {
  let code
  do {
    code = Array.from({ length: CODE_LENGTH }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('')
  } while (rooms.has(code))
  return code
}

function cleanName(name) {
  return String(name || '').trim().slice(0, 16)
}

function findBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.players.has(socketId)) return room
  }
  return null
}

function addPlayer(room, socketId, name) {
  const used = new Set([...room.players.values()].map((p) => p.lane))
  let lane = 0
  while (used.has(lane)) lane++
  room.players.set(socketId, { name, position: 0, lane, clicks: [] })
}

function createRoom(socketId, name) {
  const clean = cleanName(name)
  if (!clean) return { error: 'Escreve um nome.' }
  const room = {
    code: newCode(),
    hostId: socketId,
    maxPlayers: MAX_PLAYERS,
    status: 'lobby',
    players: new Map(),
    timer: null,
    ranking: null
  }
  addPlayer(room, socketId, clean)
  rooms.set(room.code, room)
  return { room }
}

function joinRoom(socketId, name, code) {
  const clean = cleanName(name)
  if (!clean) return { error: 'Escreve um nome.' }
  const room = rooms.get(String(code || '').trim().toUpperCase())
  if (!room) return { error: 'Sala não encontrada.' }
  if (room.status !== 'lobby') return { error: 'A corrida já começou.' }
  if (room.players.size >= room.maxPlayers) return { error: 'Sala cheia.' }
  addPlayer(room, socketId, clean)
  return { room }
}

function leave(socketId) {
  const room = findBySocket(socketId)
  if (!room) return null
  room.players.delete(socketId)
  if (room.players.size === 0) {
    clearInterval(room.timer)
    rooms.delete(room.code)
    return null
  }
  if (room.hostId === socketId) room.hostId = room.players.keys().next().value
  return room
}

function start(socketId) {
  const room = findBySocket(socketId)
  if (!room) return { error: 'Não estás numa sala.' }
  if (room.hostId !== socketId) return { error: 'Só o anfitrião pode começar.' }
  if (room.status !== 'lobby') return { error: 'A corrida já começou.' }
  if (room.players.size < MIN_PLAYERS) return { error: 'São precisos pelo menos ' + MIN_PLAYERS + ' jogadores.' }
  room.status = 'countdown'
  return { room }
}

function reset(socketId) {
  const room = findBySocket(socketId)
  if (!room) return { error: 'Não estás numa sala.' }
  if (room.hostId !== socketId) return { error: 'Só o anfitrião pode continuar.' }
  if (room.status !== 'finished') return { error: 'A corrida ainda não terminou.' }
  room.status = 'lobby'
  room.ranking = null
  for (const p of room.players.values()) {
    p.position = 0
    p.clicks = []
  }
  return { room }
}

function publicRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    maxPlayers: room.maxPlayers,
    minPlayers: MIN_PLAYERS,
    goal: GOAL,
    status: room.status,
    ranking: room.ranking,
    players: [...room.players.entries()].map(([id, p]) => ({ id, name: p.name, lane: p.lane, position: p.position }))
  }
}

module.exports = { createRoom, joinRoom, leave, start, reset, findBySocket, publicRoom }