const socket = io()
const status = document.getElementById('status')

socket.on('connect', () => { status.textContent = 'Ligado' })
socket.on('disconnect', () => { status.textContent = 'Desligado' })