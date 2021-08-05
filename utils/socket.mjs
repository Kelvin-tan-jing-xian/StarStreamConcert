import { Server, Socket } from 'socket.io';
import JWT                from 'jsonwebtoken';

/**
 * Initialize the socket server
 * @param {import('http').Server}         serverHttp The http server
 */
export function initialize_socket(serverExp, serverHttp) {
	const ServerIO   = new Server(serverHttp, { 
		cors:        { origin: '*' }, 
		serveClient: true,
		path:        '/socket.io/'
	});
	ServerIO.on("connection", onSocketConnect.bind(null, ServerIO));
	ServerIO.attach(serverHttp);
}

/**
 * When a socket is connected, configure the socket with all the necessary callbacks
 * @param {Server} server
 * @param {Socket} socket 
 */
function onSocketConnect(server, socket) {
	console.log(`Socket connected: ${socket.id}`);
	socket.on('webrtc_start',      onSignalStart.bind(null, server, socket));
	socket.on('webrtc_offer',      onSignalOffer.bind(null, server, socket));
	socket.on('webrtc_answer',     onSignalAnswer.bind(null, server, socket));
	socket.on('webrtc_ice_config', onSignalConfigIce.bind(null, server, socket));
	socket.on("msg-recv",          onMessageReceived.bind(null, server, socket));
	socket.on("join",              onSocketJoin.bind(null, server, socket));
	socket.on("exit",              onSocketExit.bind(null, server, socket));
}

/**
 * When a client emits a join event to enter a room
 * @param {Server} server
 * @param {Socket} socket 
 * @param {{}} payload 
 */
async function onSocketJoin(server, socket, payload) {
	try {
		console.log(payload);
		const contents = JWT.verify(payload, 'the-key');
		const streamId = contents.streamId;
		const userId   = contents.userId;
		const role     = contents.role;

		console.log(`Socket credentials: ${contents}`);

		const clients   = server.sockets.adapter.rooms.get(streamId);
		const clientQty = (clients)? clients.size : 0;

		console.log(`Room [${streamId}]: has ${clientQty} sockets`);

		socket.join(streamId);
		switch(role) {
			case "HOST": 
				console.log(`Room [${streamId}]: Streamer joined  ${userId}`);
				socket.emit("host_joined", streamId); 
				break;
			default:    
				console.log(`Room [${streamId}]: Viewer   joined ${userId}`);
				socket.emit("guest_joined",  streamId); 
				break;
		}
	}
	catch (error) {
		console.error(`Failed to connect to stream`);
		throw new Error("The request payload is invalid");
	}
}

/**
 * When a client emits a exit event to leave the room
 * @param {Server} server
 * @param {Socket} socket 
 * @param {{}} payload 
 */
async function onSocketExit(server, socket, payload) {
	const clients   = server.sockets.adapter.rooms.get(streamId);
	const clientQty = (clients)? clients.size : 0;

	try {
		const contents = JWT.verify(payload, 'the-key');
		const streamId = contents.streamId;
		const userId   = contents.userId;
		const role     = contents.role;

		socket.leave(streamId);
		switch(role) {
			case "streamer": 
			server.sockets.adapter.delSockets({
				rooms: streamId,
				flags: {
					broadcast: true
				}
			});
			break;

			default:
				socket.emit("room_exit", streamId, userId);
				socket.leave(streamId); 
				break;
		}
	}
	catch (error) {
		console.error(`Failed to connect to stream`);
		throw new Error("The request payload is invalid");
	}
	console.log(`There currently are ${clientQty} sockets connected`);	
	console.log(`Joined stream ${streamId}`);
}

/**
 * Handles event where a message is sent
 * @param {Server} server	The socket server
 * @param {Socket} socket   The current socket
 * @param {{}} payload 		The incoming message payload
 */
async function onMessageReceived(server, socket, payload) {
	payload = Object.assign(payload, {timestamp: (new Date()).getTime() });
	socket.broadcast.to(payload.streamId).emit("msg-recv", payload.userId, payload.username, payload.timestamp, payload.msg);
	socket.emit("msg-recv", payload.userId, payload.username, payload.timestamp, payload.msg);
}

/**
 * Request the host to start a RTC connection with this socket
 * @param {Server} server	The socket server
 * @param {Socket} socket   The current socket
 * @param {string} streamId The stream identifier
 */
async function onSignalStart(server, socket, streamId) {
	socket.broadcast.to(streamId).emit('webrtc_start');
}

/**
 * Request the guests to take up the offer
 * @param {Server} server	The socket server
 * @param {Socket} socket   The current socket
 * @param {{}} event The offer event
 */
async function onSignalOffer(server, socket, event) {
	socket.broadcast.to(event.streamId).emit('webrtc_offer',  event.sdp);
}

/**
 * Ack the host's offer
 * @param {Server} server	The socket server
 * @param {Socket} socket   The current socket
 * @param {{}} event The offer event
 */
async function onSignalAnswer(server, socket, event) {
	socket.broadcast.to(event.streamId).emit('webrtc_answer',  event.sdp);
}

/**
 * Signal to configure ICE
 * @param {Server} server	The socket server
 * @param {Socket} socket   The current socket
 * @param {{}} event The ice config event
 */
async function onSignalConfigIce(server, socket, event) {
	socket.broadcast.to(event.streamId).emit('webrtc_ice_config',  event);
}