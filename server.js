const http = require('http');
const WebSocket = require('ws');

// Crear servidor HTTP básico requerido por Railway
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Rhythm+ Multiplayer Server is running smoothly!\n');
});

// Acoplar el servidor WebSocket al servidor HTTP utilizando el puerto dinámico de Railway
const wss = new WebSocket.Server({ server });
const rooms = new Map(); // Almacena las salas activas

console.log("=========================================");
console.log(" Rhythm+ Multiplayer Server Active (v30.0 - Railway Ready)");
console.log("=========================================");

wss.on('connection', (ws) => {
    let currentRoomId = null;
    let playerName = 'Jugador';

    console.log("[+] A player connected! Total clients:", wss.clients.size);

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === 'CREATE_ROOM') {
                playerName = data.name || 'Host';
                currentRoomId = Math.random().toString(36).substring(2, 6).toUpperCase();
                
                rooms.set(currentRoomId, {
                    host: ws,
                    hostName: playerName,
                    guest: null,
                    guestName: null,
                    hostUrl: '',
                    guestUrl: '',
                    status: 'waiting'
                });

                ws.send(JSON.stringify({
                    type: 'ROOM_CREATED',
                    roomId: currentRoomId
                }));

                console.log(`[ROOM] Sala creada: ${currentRoomId} por ${playerName}`);
            } 
            else if (data.type === 'JOIN_ROOM') {
                currentRoomId = data.roomId ? data.roomId.trim().toUpperCase() : '';
                playerName = data.name || 'Oponente';
                
                const room = rooms.get(currentRoomId);

                if (room && !room.guest) {
                    room.guest = ws;
                    room.guestName = playerName;

                    console.log(`[ROOM] ${playerName} se unió a la sala: ${currentRoomId}`);

                    // Notificar al invitado éxito
                    ws.send(JSON.stringify({
                        type: 'JOIN_SUCCESS',
                        opponent: room.hostName
                    }));

                    // Notificar al host que el oponente se unió
                    if (room.host && room.host.readyState === WebSocket.OPEN) {
                        room.host.send(JSON.stringify({
                            type: 'OPPONENT_JOINED',
                            opponent: room.guestName
                        }));
                    }
                } else {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'La sala no existe o ya está llena.'
                    }));
                }
            }
            // Sincronización basada en presencia en juego (/game/)
            else if (data.type === 'UPDATE_LOCATION') {
                if (!currentRoomId || !rooms.has(currentRoomId)) return;
                const room = rooms.get(currentRoomId);
                
                const isHost = (ws === room.host);
                if (isHost) {
                    room.hostUrl = data.url;
                } else {
                    room.guestUrl = data.url;
                }

                // Notificar al oponente la ubicación actual
                const opponentWs = isHost ? room.guest : room.host;
                if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
                    opponentWs.send(JSON.stringify({
                        type: 'OPPONENT_LOCATION',
                        url: data.url
                    }));
                }

                // Si ambos tienen '/game/' en su URL y la sala está esperando, disparamos el conteo
                if (room.status === 'waiting' && room.hostUrl && room.guestUrl && 
                    room.hostUrl.includes('/game/') && room.guestUrl.includes('/game/')) {
                    
                    room.status = 'countdown';
                    console.log(`[SYNC] ¡Ambos entraron al juego en sala ${currentRoomId}! Iniciando cuenta regresiva...`);

                    if (room.host && room.host.readyState === WebSocket.OPEN) {
                        room.host.send(JSON.stringify({ type: 'START_COUNTDOWN' }));
                    }
                    if (room.guest && room.guest.readyState === WebSocket.OPEN) {
                        room.guest.send(JSON.stringify({ type: 'START_COUNTDOWN' }));
                    }
                }
            }
            else if (data.type === 'UPDATE_STATS') {
                if (!currentRoomId || !rooms.has(currentRoomId)) return;
                const room = rooms.get(currentRoomId);
                
                const isHost = (ws === room.host);
                const opponentWs = isHost ? room.guest : room.host;

                if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
                    opponentWs.send(JSON.stringify({
                        type: 'OPPONENT_STATS',
                        name: playerName,
                        score: data.score,
                        combo: data.combo,
                        accuracy: data.accuracy,
                        finished: data.finished
                    }));
                }
            }
        } catch (e) {
            console.error("Error procesando mensaje:", e);
        }
    });

    ws.on('close', () => {
        console.log("[-] A player disconnected.");
        if (currentRoomId && rooms.has(currentRoomId)) {
            const room = rooms.get(currentRoomId);
            const opponentWs = (ws === room.host) ? room.guest : room.host;
            
            if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
                opponentWs.send(JSON.stringify({
                    type: 'ERROR',
                    message: 'Tu oponente se ha desconectado.'
                }));
            }
            rooms.delete(currentRoomId);
            console.log(`[ROOM] Sala ${currentRoomId} eliminada por desconexión.`);
        }
    });
});

// Usar el puerto asignado por Railway obligatoriamente
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
