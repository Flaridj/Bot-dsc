const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { WebcastPushConnection } = require("tiktok-live-connector");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const tiktok = new WebcastPushConnection("niims5");

app.use(express.static("public"));

tiktok.connect();

tiktok.on("chat",(data)=>{
  io.emit("chat",data);
});

server.listen(process.env.PORT || 3000);
