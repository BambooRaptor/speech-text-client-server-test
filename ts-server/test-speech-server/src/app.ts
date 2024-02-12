import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { new_transcription_stream } from './streaming_audio.js';
import { WebSocketServer } from 'ws';

const port = process.env.PORT || '3000';

// !!! [WS] START
const io = new WebSocketServer({ port: parseInt(port) }, () => {
	console.log(`Listening on port ${port}`);
});
// !!! [WS] END

// !!! [Express + Socket.IO] START
// const __dirname = new URL('../public', import.meta.url).pathname;

// const app = express();
// const server = createServer(app);
// const io = new Server(server);

// app.get('/', (req, res) => {
// 	res.sendFile(__dirname + '/index.html');
// })

// server.listen(port, () => {
// 	console.log(`express server listening on port ${port}`);
// })
// !!! [Express + Socket.IO] START

// Leave this as is, for both socket.io & ws
io.on('connection', (socket) => {
	console.log(`CONNECTION: new user connected!`);

	const transcript_stream = new_transcription_stream();

	socket.on('disconnect', () => {
		console.log(`DISCONNECT: ${socket} disconnected.`);
	})

	socket.on('recognize', (chunk) => {
		transcript_stream.write(chunk, (err) => console.error);
	})

	socket.on('message', (msg) => {
		// console.log(`MESSAGE recieved!`);
		console.log(`MESSAGE ${msg.toString().length}`);
		transcript_stream.write(msg, (err) => console.error);
	})
});

