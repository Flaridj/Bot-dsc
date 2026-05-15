const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const { WebcastPushConnection } = require("tiktok-live-connector");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const USERNAME = "niims5";

app.use(express.static("public"));

const tiktok = new WebcastPushConnection(USERNAME);

// 🎯 BINGO 5x5
const bingo = [
  ["chat","chien","lion","tigre","renard"],
  ["mars","terre","lune","soleil","etoile"],
  ["europe","asie","afrique","amerique","oceanie"],
  ["eau","feu","air","terre","glace"],
  ["robot","ia","code","hack","virus"]
];

let leaderboard = {};
let cooldown = {};
let spectators = 0;

// 🔁 ROUND
function newRound() {
  const x = Math.floor(Math.random() * 5);
  const y = Math.floor(Math.random() * 5);
  const word = bingo[x][y];

  io.emit("round", { word });
}

// 🚫 ANTI SPAM
function canSend(user){
  const now = Date.now();
  if(!cooldown[user]) cooldown[user] = 0;

  if(now - cooldown[user] < 1500){
    return false;
  }

  cooldown[user] = now;
  return true;
}

// 🧠 CHECK BINGO WORD
function checkWord(word){
  return bingo.flat().includes(word);
}

// 📡 TIKTOK CONNECT
tiktok.connect().then(() => {
  console.log("TikTok connecté");
});

// 💬 CHAT
tiktok.on("chat", (data) => {
  const user = data.uniqueId;
  const msg = data.comment.toLowerCase();

  if(!canSend(user)) return;

  io.emit("chat", { user, msg });

  if(checkWord(msg)){
    leaderboard[user] = (leaderboard[user] || 0) + 1;

    io.emit("win", { user, msg, leaderboard });

    newRound();
  }
});

// 👁 VIEWERS
tiktok.on("roomUser", (data) => {
  spectators = data.viewerCount || 0;

  io.emit("stats", {
    spectators
  });
});

// ➕ FOLLOW
tiktok.on("follow", (data) => {
  const user = data.uniqueId;

  leaderboard[user] = (leaderboard[user] || 0) + 2;

  io.emit("follow", { user, leaderboard });
});

// 🎁 GIFT SYSTEM
tiktok.on("gift", (data) => {
  const user = data.uniqueId;
  const coins = data.diamondCount || 0;

  if(coins >= 10){
    leaderboard[user] = (leaderboard[user] || 0) + 5;

    io.emit("bigWin", { user, coins, leaderboard });

    newRound();
  }
});

// 🔁 LOOP
setInterval(newRound, 20000);

// 🚀 START
server.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
