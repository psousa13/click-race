# Click Race

Jogo multijogador em tempo real, feito com Node.js, Express e Socket.IO. Cada jogador clica o mais depressa possível para fazer avançar a sua barra até à meta. O primeiro a chegar vence.

## Funcionalidades implementadas

1. Salas com código de 4 letras, de 2 a 5 jogadores.
2. Lobby com lista de jogadores, anfitrião e botão de copiar o código da sala.
3. O anfitrião começa a corrida quando há pelo menos 2 jogadores.
4. Contagem decrescente de 3 segundos e corrida com uma faixa por jogador.
5. Contagem de cliques no servidor (servidor autoritativo), com limite de 15 cliques por segundo.
6. Classificação final e opção de jogar outra vez.
7. Se o anfitrião sai, o jogador seguinte passa a anfitrião. Se sobrar um só jogador durante a contagem, a sala volta ao lobby, e durante a corrida esse jogador vence.

## Requisitos

1. Node.js 18 ou superior.

## Como executar

~~~powershell
npm install
npm run dev
~~~

Abrir `http://localhost:3000`. O estado do servidor pode ser confirmado em `http://localhost:3000/api/health`. Para jogar a partir de outros dispositivos na mesma rede, usar o IP do computador em vez de `localhost`.

## Como jogar

1. Escrever um nome e carregar em "Criar sala".
2. Partilhar o código da sala com os outros jogadores, que o escrevem em "Entrar".
3. O anfitrião carrega em "Começar".
4. Durante a corrida, clicar no botão ou premir a barra de espaço. São precisos 100 cliques para chegar à meta.

## Eventos Socket.IO

Cliente para servidor. Os pedidos com resposta devolvem `{ ok: true }` ou `{ error: "mensagem" }`.

| Evento | Dados | Descrição |
|---|---|---|
| `createRoom` | `{ name }` | Cria uma sala e entra nela como anfitrião |
| `joinRoom` | `{ name, code }` | Entra numa sala em estado de lobby |
| `start` | nenhum | O anfitrião inicia a contagem decrescente |
| `click` | nenhum | Conta um clique, só durante a corrida |
| `playAgain` | nenhum | O anfitrião devolve a sala ao lobby |
| `leaveRoom` | nenhum | Sai da sala |

Servidor para cliente:

| Evento | Dados | Descrição |
|---|---|---|
| `room` | estado da sala | Estado completo: código, jogadores, fase e classificação |
| `countdown` | número | Segundos que faltam para começar |
| `go` | nenhum | A corrida começou |
| `state` | lista de `{ id, position }` | Posição de cada jogador, a cada clique |

## Estrutura

~~~
server.js          arranque, Express e eventos Socket.IO
src/constants.js   limites do jogo (jogadores, meta, cliques por segundo)
src/rooms.js       salas, jogadores e estado público
src/game.js        contagem, cliques e fim da corrida
public/            cliente (HTML, JavaScript e CSS)
~~~

## Uso de IA

O código foi desenvolvido com apoio do Claude (Anthropic). O assistente não tem acesso ao disco do autor, e todos os testes são feitos pelo autor.