import WebSocket from 'ws'

enum MessageType {
  CONNECTION = 'connection',
  MESSAGE = 'message'
}

type MessageData = {
  type: MessageType,
  author?: string,
  content: string,
  timestamp: Date
}

let connectionCount = 0

const wsServer = new WebSocket.Server({ port: 4141 })

function getUrlParam (url: string, field: string): string | null {
  const params = url?.split('/')[1]
  return (new URLSearchParams(params)).get(field)
}

function isSameChatId (currentUrl: string, clientUrl: string): boolean {
  return getUrlParam(currentUrl, 'id') === getUrlParam(clientUrl, 'id')
}

function sendMessage (current: WebSocket, client: WebSocket, messageData: MessageData): void {
  if (client !== current &&
    client.readyState === WebSocket.OPEN &&
    isSameChatId(current.url, client.url)) {
    const data = JSON.stringify({
      ...messageData,
      author: getUrlParam(current.url, 'name')
    })
    client.send(data)
  }
}

wsServer.on('connection', function (ws, request) {
  connectionCount++
  console.log(`${connectionCount} clients connected`)
  ws.url = request.url || ''

  wsServer.clients.forEach(function (client) {
    sendMessage(ws, client, {
      type: MessageType.CONNECTION,
      content: 'conectado(a)',
      timestamp: new Date()
    })
  })

  ws.on('message', function (data) {
    const messageData = <MessageData>JSON.parse(<string>data)
    wsServer.clients.forEach(function (client) {
      sendMessage(ws, client, messageData)
    })
  })

  ws.on('close', function () {
    connectionCount--
    console.log(`${connectionCount} clients connected`)
    wsServer.clients.forEach(function (client) {
      sendMessage(ws, client, {
        type: MessageType.CONNECTION,
        content: 'desconectado(a)',
        timestamp: new Date()
      })
    })
  })
})
