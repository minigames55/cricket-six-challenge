
const canvas = document.getElementById("ground");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const ballsEl = document.getElementById("balls");
const wicketsEl = document.getElementById("wickets");
const bestEl = document.getElementById("best");
const coinsEl = document.getElementById("coins");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const hitBtn = document.getElementById("hitBtn");
const difficultyEl = document.getElementById("difficulty");

const W = 800;
const H = 900;

let score = 0;
let balls = 0;
let wickets = 0;
let coins = Number(localStorage.getItem("cricketCoins")) || 0;
let best = Number(localStorage.getItem("cricketBest")) || 0;

let playing = false;
let ballActive = false;
let ballX = 170;
let ballY = 610;
let ballSpeed = 400;
let lastTime = 0;
let animationId = null;
let nextTimer = null;
let shotEffect = 0;
let shotText = "";
let shotX = 0;
let shotY = 0;
let swing = 0;
let particles = [];

coinsEl.textContent = coins;
bestEl.textContent = best;

function roundedRect(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawStadium() {
  ctx.clearRect(0, 0, W, H);

  // Night sky
  const sky = ctx.createLinearGradient(0, 0, 0, 370);
  sky.addColorStop(0, "#071321");
  sky.addColorStop(1, "#30475b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, 370);

  // Stadium roof
  ctx.fillStyle = "#101d2a";
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.lineTo(400, 20);
  ctx.lineTo(800, 100);
  ctx.lineTo(800, 160);
  ctx.lineTo(0, 160);
  ctx.closePath();
  ctx.fill();

  // Stadium seating
  const stand = ctx.createLinearGradient(0, 130, 0, 400);
  stand.addColorStop(0, "#253d52");
  stand.addColorStop(1, "#111e30");
  ctx.fillStyle = stand;
  ctx.fillRect(0, 135, W, 260);

  // Crowd rows
  const crowdColors = ["#d8dce0", "#e3b64e", "#b84848", "#4c91a0", "#79a76e"];
  for (let row = 0; row < 11; row++) {
    for (let col = 0; col < 82; col++) {
      const x = col * 10 + (row % 2) * 4;
      const y = 165 + row * 19;
      ctx.fillStyle = crowdColors[(col * 3 + row * 7) % crowdColors.length];
      ctx.fillRect(x, y, 4, 5);
    }
  }

  // Stadium boundary lights
  ctx.strokeStyle = "#d5e4e7";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.quadraticCurveTo(400, 320, 800, 400);
  ctx.stroke();

  // Floodlight towers
  [65, 735].forEach(x => {
    ctx.fillStyle = "#bac8d0";
    ctx.fillRect(x - 3, 65, 6, 290);
    roundedRect(x - 34, 55, 68, 24, 4, "#dce7e9");

    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = "#fff6ce";
      ctx.beginPath();
      ctx.arc(x - 24 + i * 10, 67, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    const glow = ctx.createRadialGradient(x, 80, 5, x, 80, 210);
    glow.addColorStop(0, "rgba(255,245,190,.17)");
    glow.addColorStop(1, "rgba(255,245,190,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 210, 70, 420, 450);
  });

  // Outfield grass
  const grass = ctx.createLinearGradient(0, 360, 0, 900);
  grass.addColorStop(0, "#31784b");
  grass.addColorStop(1, "#0d422c");
  ctx.fillStyle = grass;
  ctx.fillRect(0, 360, W, 540);

  // Mowed grass strips
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 ? "rgba(180,220,140,.07)" : "rgba(0,0,0,.06)";
    ctx.beginPath();
    ctx.moveTo(i * 100, 390);
    ctx.lineTo((i + 1) * 100, 390);
    ctx.lineTo((i + 1) * 130, 900);
    ctx.lineTo(i * 130, 900);
    ctx.closePath();
    ctx.fill();
  }

  // Boundary rope
  ctx.strokeStyle = "#d9e2c7";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(400, 650, 370, 225, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Pitch shadow
  ctx.fillStyle = "rgba(0,0,0,.2)";
  ctx.beginPath();
  ctx.ellipse(400, 660, 135, 270, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pitch
  const pitch = ctx.createLinearGradient(0, 390, 0, 900);
  pitch.addColorStop(0, "#b99a6c");
  pitch.addColorStop(1, "#d3b987");
  ctx.fillStyle = pitch;
  ctx.beginPath();
  ctx.moveTo(310, 405);
  ctx.lineTo(490, 405);
  ctx.lineTo(545, 900);
  ctx.lineTo(255, 900);
  ctx.closePath();
  ctx.fill();

  // Pitch texture
  for (let i = 0; i < 70; i++) {
    const x = 310 + (i * 37 % 180);
    const y = 430 + (i * 61 % 450);
    ctx.fillStyle = i % 2 ? "rgba(95,65,35,.08)" : "rgba(255,255,255,.09)";
    ctx.fillRect(x, y, 3, 10);
  }

  // Crease
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(270, 790);
  ctx.lineTo(530, 790);
  ctx.moveTo(300, 455);
  ctx.lineTo(500, 455);
  ctx.stroke();

  // Pitch stumps at bowler end
  drawStumps(400, 455, 0.8);
}

function drawStumps(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#f5e9c8";
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(i * 13 - 2, -38, 5, 40);
  }
  ctx.fillRect(-17, -42, 34, 5);
  ctx.restore();
}

function drawBatsman() {
  const x = 565;
  const y = 690;

  ctx.save();
  ctx.translate(x, y);

  // Player shadow
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(0, 10, 48, 13, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = "#f0f0e9";
  ctx.lineWidth = 17;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-12, -12);
  ctx.lineTo(-20, 35);
  ctx.moveTo(12, -12);
  ctx.lineTo(23, 35);
  ctx.stroke();

  // Shoes
  roundedRect(-39, 25, 27, 12, 5, "#151d28");
  roundedRect(10, 25, 28, 12, 5, "#151d28");

  // Body
  roundedRect(-25, -100, 50, 91, 12, "#123f91");

  // Shirt detail
  ctx.strokeStyle = "#e7bd50";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-22, -65);
  ctx.lineTo(22, -65);
  ctx.stroke();

  // Arms
  ctx.strokeStyle = "#d9a77f";
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(-19, -85);
  ctx.lineTo(-39, -50);
  ctx.moveTo(19, -85);
  ctx.lineTo(36, -62);
  ctx.stroke();

  // Helmet
  ctx.fillStyle = "#172a47";
  ctx.beginPath();
  ctx.arc(0, -119, 24, Math.PI, 0);
  ctx.lineTo(24, -111);
  ctx.lineTo(-24, -111);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#b5d1dd";
  ctx.fillRect(10, -117, 20, 4);

  // Bat animation
  ctx.save();
  ctx.translate(30, -57);
  ctx.rotate(swing > 0 ? -0.8 * swing : -0.35);
  roundedRect(-6, -5, 13, 83, 5, "#c18a48");
  roundedRect(-7, -12, 15, 13, 4, "#292b32");
  ctx.restore();

  ctx.restore();

  drawStumps(625, 690, 1);
}

function drawBowler() {
  ctx.save();
  ctx.translate(390, 485);

  ctx.fillStyle = "#101c32";
  ctx.beginPath();
  ctx.arc(0, -17, 12, 0, Math.PI * 2);
  ctx.fill();

  roundedRect(-12, -5, 24, 38, 7, "#b72e3d");

  ctx.strokeStyle = "#e0b18b";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-9, 5);
  ctx.lineTo(-25, 25);
  ctx.moveTo(9, 5);
  ctx.lineTo(23, -5);
  ctx.stroke();

  ctx.strokeStyle = "#d8d8d8";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-6, 31);
  ctx.lineTo(-12, 48);
  ctx.moveTo(6, 31);
  ctx.lineTo(15, 48);
  ctx.stroke();

  ctx.restore();
}

function drawBall() {
  if (!ballActive) return;

  // Ball shadow
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.beginPath();
  ctx.ellipse(ballX + 7, ballY + 12, 17, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red leather ball
  const ball = ctx.createRadialGradient(
    ballX - 6, ballY - 7, 2,
    ballX, ballY, 17
  );
  ball.addColorStop(0, "#ff7770");
  ball.addColorStop(0.55, "#d51d29");
  ball.addColorStop(1, "#650c19");

  ctx.fillStyle = ball;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 17, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#fff0df";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ballX, ballY, 10, -1, 1);
  ctx.stroke();
}

function drawEffects() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  if (shotEffect > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, shotEffect);
    ctx.fillStyle = "#fff0a3";
    ctx.font = "bold 65px Arial";
    ctx.textAlign = "center";
    ctx.fillText(shotText, shotX, shotY - (1 - shotEffect) * 70);
    ctx.restore();
  }
}

function drawScene() {
  drawStadium();
  drawBowler();
  drawBatsman();
  drawBall();
  drawEffects();
}

function updateUI() {
  scoreEl.textContent = score;
  ballsEl.textContent = balls + "/12";
  wicketsEl.textContent = wickets;
  bestEl.textContent = best;
  coinsEl.textContent = coins;
}

function setMessage(text) {
  messageEl.textContent = text;
}

function spawnParticles(x, y, color) {
  for (let i = 0; i < 24; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 60 + Math.random() * 180;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 5,
      life: 1,
      color
    });
  }
}

function updateEffects(dt) {
  particles.forEach(p => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 100 * dt;
    p.life -= dt * 1.5;
  });
  particles = particles.filter(p => p.life > 0);

  if (shotEffect > 0) {
    shotEffect -= dt * 0.8;
  }

  if (swing > 0) {
    swing = Math.max(0, swing - dt * 3);
  }
}

function getSpeed() {
  const level = difficultyEl.value;
  if (level === "easy") return 310;
  if (level === "hard") return 570;
  return 420;
}

function startMatch() {
  clearTimeout(nextTimer);
  cancelAnimationFrame(animationId);

  score = 0;
  balls = 0;
  wickets = 0;
  playing = true;
  ballActive = false;
  particles = [];
  shotEffect = 0;

  startBtn.textContent = "↻ RESTART MATCH";
  hitBtn.disabled = true;
  updateUI();
  setMessage("MATCH STARTED • GET READY");

  drawScene();
  nextBall();
}

function nextBall() {
  if (!playing) return;

  if (balls >= 12) {
    endMatch();
    return;
  }

  ballX = 155;
  ballY = 615;
  ballSpeed = getSpeed();
  ballActive = true;
  lastTime = 0;
  hitBtn.disabled = false;
  setMessage("BOWLER RUNNING IN • WATCH THE BALL");

  animationId = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
  if (!playing) return;

  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.04);
  lastTime = timestamp;

  if (ballActive) {
    ballX += ballSpeed * dt;
    ballY += ballSpeed * dt * 0.15;

    if (ballX >= 570) {
      missBall();
      return;
    }
  }

  updateEffects(dt);
  drawScene();

  animationId = requestAnimationFrame(gameLoop);
}

function missBall() {
  ballActive = false;
  hitBtn.disabled = true;
  balls++;
  wickets++;
  updateUI();
  setMessage("BOWLED! WICKET! TRY AGAIN");

  spawnParticles(600, 680, "#f3d16d");
  drawScene();

  nextTimer = setTimeout(nextBall, 1300);
}

function playShot() {
  if (!playing || !ballActive) return;

  ballActive = false;
  hitBtn.disabled = true;
  cancelAnimationFrame(animationId);

  const distance = Math.abs(ballX - 550);
  let runs = 0;

  if (distance < 22) {
    runs = 6;
    shotText = "SIX!";
    setMessage("WHAT A SHOT! SIX RUNS!");
    spawnParticles(550, 550, "#ffdc65");
  } else if (distance < 48) {
    runs = 4;
    shotText = "FOUR!";
    setMessage("BEAUTIFUL BOUNDARY! FOUR!");
    spawnParticles(550, 550, "#8de7ff");
  } else if (distance < 78) {
    runs = 2;
    shotText = "TWO!";
    setMessage("TWO RUNS!");
  } else if (distance < 105) {
    runs = 1;
    shotText = "ONE!";
    setMessage("ONE RUN!");
  } else {
    shotText = "OUT!";
    setMessage("BAD TIMING! CAUGHT OUT!");
    wickets++;
  }

  score += runs;
  balls++;
  swing = 1;
  shotEffect = 1;

  shotX = 430;
  shotY = 410;

  if (runs > 0) {
    coins += runs * 2;
    localStorage.setItem("cricketCoins", coins);
  }

  if (score > best) {
    best = score;
    localStorage.setItem("cricketBest", best);
  }

  updateUI();
  drawScene();

  nextTimer = setTimeout(nextBall, 1400);
}

function endMatch() {
  playing = false;
  ballActive = false;
  hitBtn.disabled = true;
  startBtn.textContent = "▶ PLAY AGAIN";

  setMessage(
    "MATCH OVER • SCORE: " + score + " • WICKETS: " + wickets
  );

  drawScene();
}

startBtn.addEventListener("click", startMatch);
hitBtn.addEventListener("click", playShot);

drawScene();
updateUI();
