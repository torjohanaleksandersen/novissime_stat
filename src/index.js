import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { User } from "./user.js";
import { ServerState } from "./server-state.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const PORT = process.env.PORT || 5000;

const server = new ServerState()

io.on('connection', socket => {
    const user = new User(socket)
    server.users.push(user)

    socket.on('disconnect', () => {
        server.users.splice(server.users.indexOf(user), 1)
        server.sendMsgToAllClients('player-disconnected', socket.id)  
    })
})

setInterval(() => {
    server.updateAllClients()
}, server.tickSpeed)


app.use(express.static("public"))

httpServer.listen(PORT);