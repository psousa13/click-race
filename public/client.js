const socket = io({ transports: ['websocket'] })
const COLORS = ['#ff6b57', '#ffb938', '#4ade80', '#38bdf8', '#ff7ab8']
const VIEWS = ['home', 'lobby', 'countdown', 'race', 'results']
const MAX_CLICKS_PER_SECOND = 14
const $ = (id) => document.getElementById(id)

let room = null
let count = ''
let myBase = 0
let pending = 0
let sent = []
const bars = new Map()

function show(view) {
  for (const v of VIEWS) $(v).hidden = v !== view
}

function pop(el) {
  el.classList.remove('pop')
  void el.offsetWidth
  el.classList.add('pop')
}

function request(event, data = null, onOk) {
  socket.emit(event, data, (res) => {
    if (!res || res.error) {
      $('msg').textContent = res ? res.error : 'Erro.'
      return
    }
    $('msg').textContent = ''
    if (onOk) onOk()
  })
}

function dot(lane) {
  const el = document.createElement('span')
  el.className = 'dot'
  el.style.background = COLORS[lane]
  return el
}

function renderLobby() {
  const isHost = room.hostId === socket.id
  $('code').textContent = room.code
  $('size').textContent = room.players.length + '/' + room.maxPlayers + ' jogadores'
  const list = $('players')
  list.replaceChildren()
  for (const p of room.players) {
    const li = document.createElement('li')
    let label = p.name
    if (p.id === room.hostId) label += ' (anfitrião)'
    if (p.id === socket.id) label += ' (tu)'
    li.append(dot(p.lane), label)
    list.append(li)
  }
  $('start').hidden = !isHost
  $('start').disabled = room.players.length < room.minPlayers
  $('hint').textContent = isHost
    ? (room.players.length < room.minPlayers ? 'Faltam jogadores. Partilha o código da sala.' : 'Começa quando quiseres.')
    : 'À espera do anfitrião.'
}

function updateBars(players) {
  for (const p of players) {
    const fill = bars.get(p.id)
    if (!fill) continue
    const pos = p.id === socket.id ? Math.max(p.position, myBase + pending) : p.position
    fill.style.width = Math.min(100, (pos / room.goal) * 100) + '%'
  }
}

function paintMine() {
  updateBars(room.players.filter((p) => p.id === socket.id))
}

function resetMine() {
  myBase = 0
  pending = 0
  sent = []
}

function buildTrack() {
  const track = $('track')
  track.replaceChildren()
  bars.clear()
  for (const p of room.players) {
    const lane = document.createElement('div')
    lane.className = 'lane'
    const name = document.createElement('span')
    name.className = 'lname'
    name.textContent = p.id === socket.id ? p.name + ' (tu)' : p.name
    const bar = document.createElement('div')
    bar.className = 'bar'
    const fill = document.createElement('div')
    fill.className = 'fill'
    fill.style.background = COLORS[p.lane]
    bar.append(fill)
    lane.append(name, bar)
    track.append(lane)
    bars.set(p.id, fill)
  }
  updateBars(room.players)
}

function renderResults() {
  const isHost = room.hostId === socket.id
  const first = room.ranking[0]
  $('winner').textContent = first.id === socket.id ? 'Ganhaste!' : first.name + ' ganhou!'
  const list = $('ranking')
  list.replaceChildren()
  room.ranking.forEach((p, i) => {
    const li = document.createElement('li')
    const pos = document.createElement('span')
    pos.className = 'pos'
    pos.textContent = (i + 1) + '.'
    const score = document.createElement('span')
    score.className = 'score'
    score.textContent = p.position
    const name = document.createElement('span')
    name.className = 'grow'
    name.textContent = p.name + (p.id === socket.id ? ' (tu)' : '')
    li.append(pos, dot(p.lane), name, score)
    list.append(li)
  })
  $('again').hidden = !isHost
  $('rhint').textContent = isHost ? '' : 'À espera do anfitrião.'
}

function render() {
  if (!room) return show('home')
  if (room.status === 'lobby' || room.status === 'countdown') resetMine()
  if (room.status === 'lobby') {
    renderLobby()
    return show('lobby')
  }
  if (room.status === 'countdown') {
    $('num').textContent = count
    return show('countdown')
  }
  if (room.status === 'racing') {
    count = ''
    buildTrack()
    return show('race')
  }
  renderResults()
  show('results')
}

function sendClick() {
  if (!room || room.status !== 'racing') return
  const now = Date.now()
  sent = sent.filter((t) => now - t < 1000)
  if (sent.length >= MAX_CLICKS_PER_SECOND) return
  sent.push(now)
  pending++
  paintMine()
  socket.emit('click', null, (pos) => {
    pending = Math.max(0, pending - 1)
    if (typeof pos === 'number') myBase = pos
    if (room && room.status === 'racing') paintMine()
  })
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
  return new Promise((resolve, reject) => {
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.append(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    if (ok) resolve()
    else reject(new Error('copy failed'))
  })
}

socket.on('connect', () => { $('conn').textContent = 'Ligado' })
socket.on('disconnect', () => {
  $('conn').textContent = 'Desligado'
  room = null
  render()
})
socket.on('room', (r) => {
  room = r
  render()
})
socket.on('countdown', (n) => {
  count = n
  $('num').textContent = n
  pop($('num'))
})
socket.on('go', () => {
  $('racemsg').textContent = 'GO!'
  pop($('racemsg'))
  setTimeout(() => { $('racemsg').textContent = '' }, 800)
})
socket.on('state', updateBars)

$('create').onclick = () => request('createRoom', { name: $('name').value })
$('join').onclick = () => request('joinRoom', { name: $('name').value, code: $('joinCode').value })
$('start').onclick = () => request('start')
$('again').onclick = () => request('playAgain')
$('leave').onclick = () => request('leaveRoom', null, () => { room = null; render() })
$('exit').onclick = () => request('leaveRoom', null, () => { room = null; render() })

let copyTimer
$('copy').onclick = () => {
  if (!room) return
  copyText(room.code).then(() => {
    $('copy').textContent = 'Copiado'
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { $('copy').textContent = 'Copiar' }, 1500)
  }).catch(() => { $('msg').textContent = 'Não foi possível copiar.' })
}

$('tap').addEventListener('pointerdown', (e) => {
  e.preventDefault()
  sendClick()
})
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.repeat && room && room.status === 'racing') {
    e.preventDefault()
    sendClick()
  }
})