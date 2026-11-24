# Click Race

Jogo multijogador em tempo real, feito com Node.js, Express e Socket.IO. Cada jogador clica o mais depressa possível para fazer avançar o seu avatar até à meta. O primeiro a chegar vence.

## Funcionalidades implementadas

1. Esqueleto do projeto: servidor Express com Socket.IO e cliente que se liga ao servidor.

## Funcionalidades previstas

1. Criação de salas com código e escolha do número de jogadores (2 a 5).
2. Lobby, contagem decrescente e corrida.
3. Contagem de cliques no servidor (servidor autoritativo) e limite de cliques por segundo.
4. Pista com uma faixa por jogador, classificação final e novo jogo.

## Requisitos

1. Node.js 18 ou superior.

## Como executar

~~~powershell
npm install
npm run dev
~~~

Abrir `http://localhost:3000`. O estado do servidor pode ser confirmado em `http://localhost:3000/api/health`.

## Estrutura

~~~
server.js          arranque, Express e Socket.IO
src/constants.js   limites do jogo
src/rooms.js       salas e jogadores
src/game.js        contagem, cliques e fim da corrida
public/            cliente (HTML, JavaScript e CSS)
~~~

## Uso de IA

O código foi desenvolvido com apoio do Claude (Anthropic). O assistente não tem acesso ao disco do autor, e todos os testes são feitos pelo autor.