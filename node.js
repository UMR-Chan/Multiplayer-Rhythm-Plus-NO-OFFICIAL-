const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3000 });
const rooms = new Map(); // Almacena las salas activas

console.log("=========================================");
console.log(" Rhythm+ Multiplayer Server Active (v27.0)");
console.log(" Port: 3000");
console.log(" Share your local IP or Tunnel address with friends!");
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
                // Generar un código de sala aleatorio de 4 dígitos/letras
                currentRoomId = Math.random().toString(36.substring(2, 6)).toUpperCase();
                
                rooms.set(currentRoomId, {
                    host: ws,
                    hostName: playerName,
                    guest: null,
                    guestName: null
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

                    // Avisar al Host que el duelo va a comenzar
                    room.host.send(JSON.stringify({
                        type: 'START_DUEL',
                        opponent: room.guestName
                    }));

                    // Avisar al Invitado que el duelo va a comenzar
                    ws.send(JSON.stringify({
                        type: 'START_DUEL',
                        opponent: room.hostName
                    }));
                } else {
                    ws.send(JSON.stringify({
                        type: 'ERROR',
                        message: 'La sala no existe o ya está llena.'
                    }));
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
        }
    });
});