const socket = io();

const wordEl = document.getElementById("word");
const chatEl = document.getElementById("chat");
const boardEl = document.getElementById("board");
const statsEl = document.getElementById("stats");

// 🔊 TTS
function speak(text){
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "fr-FR";
  speechSynthesis.speak(msg);
}

// 🎯 ROUND
socket.on("round",(data)=>{
  wordEl.innerText = data.word;
  speak("Trouve : " + data.word);
});

// 💬 CHAT
socket.on("chat",(data)=>{
  const div = document.createElement("div");
  div.innerText = data.user + " : " + data.msg;
  chatEl.appendChild(div);
});

// 🏆 WIN
socket.on("win",(data)=>{
  speak(data.user + " gagne !");
  updateBoard(data.leaderboard);
});

// 👁 STATS
socket.on("stats",(data)=>{
  statsEl.innerText = "👁 " + data.spectators;
});

// ➕ FOLLOW
socket.on("follow",(data)=>{
  updateBoard(data.leaderboard);
});

// 💥 BIG WIN
socket.on("bigWin",(data)=>{
  speak("MEGA WIN " + data.user);
  updateBoard(data.leaderboard);
});

// 🏆 BOARD
function updateBoard(board){
  boardEl.innerHTML = "";

  Object.entries(board)
    .sort((a,b)=>b[1]-a[1])
    .forEach(([u,s])=>{
      const div = document.createElement("div");
      div.innerText = u + " : " + s;
      boardEl.appendChild(div);
    });
}
