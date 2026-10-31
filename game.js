
const canvas = document.getElementById("ground");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const ballsText = document.getElementById("balls");
const bestText = document.getElementById("best");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const hitBtn = document.getElementById("hitBtn");

let score = 0;
let balls = 12;
let best = Number(localStorage.getItem("cricketBest")) || 0;
let playing = false;
let ballActive = false;
let ballX = 50;
let lastTime = 0;
let animationId = null;
let nextBallTimer = null;

bestText.textContent = best;

function drawGround() {
  ctx.clearRect(0, 0, 400, 500);

  // Stadium sky
  const sky = ctx.createLinearGradient(0, 0, 0, 180);
  sky.addColorStop(0, "#77c9ed");
  sky.addColorStop(1, "#d8f3d8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 400, 180);

  // Stadium crowd
  ctx.fillStyle = "#344b42";
  ctx.fillRect(0, 150, 400, 65);

  for (let i = 0; i < 400; i += 12) {
    ctx.fillStyle = i % 24 === 0 ? "#ffd65a" : "#e8eeee";
    ctx.fillRect(i, 160 + (i % 3) * 8, 5, 5);
  }

  // Green ground
  ctx.fillStyle = "#278447";
  ctx.fillRect(0, 215, 400, 285);

  // Field circles
  ctx.strokeStyle = "#b7e4a8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(200, 350, 175, 120, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Pitch
  ctx.fillStyle = "#c9a66b";
  ctx.fillRect(90, 280, 220, 100);

  // Crease lines
  ctx.strokeStyle = "white";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(95, 310);
  ctx.lineTo(305, 310);
  ctx.moveTo(95, 355);
  ctx.lineTo(305, 355);
  ctx.stroke();

  // Stumps
  ctx.fillStyle = "white";
  ctx.fillRect(290, 316, 5, 30);
  ctx.fillRect(300, 316, 5, 30);
  ctx.fillRect(310, 316, 5, 30);

  // Batsman
  ctx.fillStyle = "#172b7b";
  ctx.beginPath();
  ctx.arc(270, 300, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#172b7b";
  ctx.fillRect(259, 314, 23, 37);

  // Legs
  ctx.strokeStyle = "white";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(265, 348);
  ctx.lineTo(257, 375);
  ctx.moveTo(276, 348);
  ctx.lineTo(283, 375);
  ctx.stroke();

  // Bat
  ctx.strokeStyle = "#e6c27a";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(280, 327);
  ctx.lineTo(245, 350);
  ctx.stroke();

  // Ball
  if (ballActive) {
    ctx.fillStyle = "#d92727";
    ctx.beginPath();
    ctx.arc(ballX, 340, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ballX - 4, 335);
    ctx.lineTo(ballX + 4, 345);
    ctx.stroke();
  }

  // Ground label
  ctx.fillStyle = "white";
  ctx.font = "bold 15px Arial";
  ctx.fillText("CRICKET SIX CHALLENGE", 90, 35);
}

function updateScore() {
  scoreText.textContent = score;
  ballsText.textContent = balls;
}

function startGame() {
  clearTimeout(nextBallTimer);
  cancelAnimationFrame(animationId);

  score = 0;
  balls = 12;
  playing = true;
  ballActive = false;
  ballX = 50;

  updateScore();
  message.textContent = "Get ready to hit!";
  startBtn.textContent = "RESTART GAME";
  hitBtn.disabled = true;

  drawGround();
  nextBall();
}

function nextBall() {
  if (!playing) return;

  if (balls <= 0) {
    endGame();
    return;
  }

  ballX = 50;
  ballActive = true;
  hitBtn.disabled = false;
  lastTime = 0;
  message.textContent = "Ball coming! HIT NOW!";

  animationId = requestAnimationFrame(moveBall);
}

function moveBall(timestamp) {
  if (!playing || !ballActive) return;

  if (!lastTime) lastTime = timestamp;
  const delta = Math.min((timestamp - lastTime) / 1000, 0.04);
  lastTime = timestamp;

  ballX += 210 * delta;

  if (ballX >= 300) {
    ballActive = false;
    hitBtn.disabled = true;
    balls--;
    updateScore();
    message.textContent = "OUT! You missed!";

    drawGround();
    nextBallTimer = setTimeout(nextBall, 1000);
    return;
  }

  drawGround();
  animationId = requestAnimationFrame(moveBall);
}

function hitBall() {
  if (!playing || !ballActive) return;

  ballActive = false;
  cancelAnimationFrame(animationId);
  hitBtn.disabled = true;

  const distance = Math.abs(ballX - 270);
  let runs = 0;

  if (distance < 9) {
    runs = 6;
    message.textContent = "SIX! Amazing shot! 🚀";
  } else if (distance < 23) {
    runs = 4;
    message.textContent = "FOUR! Great shot!";
  } else if (distance < 42) {
    runs = 2;
    message.textContent = "Two runs!";
  } else if (distance < 58) {
    runs = 1;
    message.textContent = "One run!";
  } else {
    message.textContent = "OUT! Bad timing!";
  }

  score += runs;
  balls--;
  updateScore();
  drawGround();

  if (score > best) {
    best = score;
    localStorage.setItem("cricketBest", best);
    bestText.textContent = best;
  }

  nextBallTimer = setTimeout(nextBall, 1100);
}

function endGame() {
  playing = false;
  ballActive = false;
  hitBtn.disabled = true;
  startBtn.textContent = "PLAY AGAIN";
  message.textContent = "Game Over! Your score: " + score;
  drawGround();
}

startBtn.addEventListener("click", startGame);
hitBtn.addEventListener("click", hitBall);

drawGround();
