const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const coinsLabel = document.getElementById("coins");
const scoreLabel = document.getElementById("score");
const livesLabel = document.getElementById("lives");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");

const W = canvas.width;
const H = canvas.height;
const groundY = 365;

let running = false;
let gameOver = false;
let animationId = null;
let frame = 0;
let score = 0;
let coinsCollected = 0;
let lives = 3;
let speed = 5;
let obstacles = [];
let coins = [];
let particles = [];

const player = {
  x: 115, y: groundY - 52, w: 43, h: 52,
  vy: 0, jumping: false, invincible: 0
};

function resetGame() {
  frame = 0;
  score = 0;
  coinsCollected = 0;
  lives = 3;
  speed = 5;
  obstacles = [];
  coins = [];
  particles = [];
  player.y = groundY - player.h;
  player.vy = 0;
  player.jumping = false;
  player.invincible = 0;
  updateHUD();
}

function updateHUD() {
  coinsLabel.textContent = coinsCollected;
  scoreLabel.textContent = score;
  livesLabel.textContent = lives;
}

function startGame() {
  if (animationId) cancelAnimationFrame(animationId);
  resetGame();
  running = true;
  gameOver = false;
  overlay.classList.add("hidden");
  loop();
}

function endGame() {
  running = false;
  gameOver = true;
  overlayTitle.textContent = "Fim de jogo! 🌸";
  overlayText.textContent = `Você fez ${score} pontos e coletou ${coinsCollected} moeda(s). Tente de novo para bater seu recorde!`;
  startButton.textContent = "↻ Jogar novamente";
  overlay.classList.remove("hidden");
}

function jump() {
  if (!running) return;
  if (!player.jumping) {
    player.vy = -14.5;
    player.jumping = true;
    makeParticles(player.x + player.w / 2, groundY - 4, "#ffffff", 5);
  }
}

function makeParticles(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    particles.push({
      x, y, vx: (Math.random() - .5) * 4,
      vy: -Math.random() * 3,
      life: 25 + Math.random() * 12, color
    });
  }
}

function spawnThings() {
  if (frame % 95 === 0) {
    const height = 30 + Math.random() * 22;
    obstacles.push({
      x: W + 20, y: groundY - height,
      w: 28 + Math.random() * 15, h: height,
      hit: false
    });
  }
  if (frame % 72 === 0) {
    const coinY = groundY - 85 - Math.random() * 95;
    for (let i = 0; i < 3; i++) {
      coins.push({ x: W + 20 + i * 34, y: coinY + Math.sin(i) * 8, r: 12, taken: false });
    }
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

function update() {
  frame++;
  score += 1;
  speed = Math.min(9, 5 + score / 700);

  player.vy += 0.68;
  player.y += player.vy;
  if (player.y + player.h >= groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
    player.jumping = false;
  }
  if (player.invincible > 0) player.invincible--;

  spawnThings();

  for (const obstacle of obstacles) {
    obstacle.x -= speed;
    if (!obstacle.hit && player.invincible === 0 && overlaps(player, obstacle)) {
      obstacle.hit = true;
      lives--;
      player.invincible = 85;
      makeParticles(player.x + player.w / 2, player.y + player.h / 2, "#ff72ad", 12);
      updateHUD();
      if (lives <= 0) {
        endGame();
        return;
      }
    }
  }
  obstacles = obstacles.filter(o => o.x + o.w > -20);

  for (const coin of coins) {
    coin.x -= speed;
    const box = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
    if (!coin.taken && overlaps(player, box)) {
      coin.taken = true;
      coinsCollected++;
      score += 50;
      makeParticles(coin.x, coin.y, "#ffd45e", 9);
      updateHUD();
    }
  }
  coins = coins.filter(c => c.x + c.r > -20 && !c.taken);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += .12;
    p.life--;
  }
  particles = particles.filter(p => p.life > 0);
  updateHUD();
}

function roundedRect(x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#bdeeff");
  sky.addColorStop(1, "#fff0fa");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sol e nuvens
  ctx.fillStyle = "#fff1a9";
  ctx.beginPath(); ctx.arc(760, 78, 35, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.88)";
  drawCloud(150 - (frame * .25 % 1050), 85, 1);
  drawCloud(520 - (frame * .15 % 1050), 135, .75);
  drawCloud(950 - (frame * .2 % 1100), 65, .9);

  // Morros
  ctx.fillStyle = "#b6e9c5";
  ctx.beginPath();
  ctx.moveTo(0, groundY); ctx.quadraticCurveTo(170, 235, 340, groundY);
  ctx.quadraticCurveTo(510, 255, 680, groundY);
  ctx.quadraticCurveTo(790, 280, 900, 300);
  ctx.lineTo(900, groundY); ctx.closePath(); ctx.fill();

  // Chão
  ctx.fillStyle = "#8cdaa4";
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = "#5dbb7e";
  ctx.fillRect(0, groundY, W, 9);
  ctx.strokeStyle = "rgba(42,144,89,.25)";
  ctx.lineWidth = 3;
  for (let x = -(frame * speed * .8 % 48); x < W; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, groundY + 26); ctx.lineTo(x + 18, groundY + 26); ctx.stroke();
  }
}

function drawCloud(x, y, scale) {
  if (x < -100) x += 1150;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.arc(0, 10, 18, 0, Math.PI * 2);
  ctx.arc(22, 0, 24, 0, Math.PI * 2);
  ctx.arc(47, 11, 17, 0, Math.PI * 2);
  ctx.rect(0, 10, 47, 18);
  ctx.fill();
  ctx.restore();
}

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(player.invincible / 6) % 2 === 0) return;
  const x = player.x, y = player.y;
  // Cauda
  ctx.fillStyle = "#f28a42";
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 34); ctx.lineTo(x - 12, y + 29);
  ctx.lineTo(x - 3, y + 45); ctx.lineTo(x + 10, y + 43); ctx.fill();
  // Corpo e cabeça de raposinha
  roundedRect(x + 4, y + 22, 35, 29, 11, "#f28a42");
  ctx.fillStyle = "#f28a42";
  ctx.beginPath();
  ctx.arc(x + 23, y + 20, 19, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 10); ctx.lineTo(x + 8, y - 5); ctx.lineTo(x + 19, y + 5); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 28, y + 5); ctx.lineTo(x + 40, y - 4); ctx.lineTo(x + 38, y + 13); ctx.fill();
  // Focinho
  ctx.fillStyle = "#fff0df";
  ctx.beginPath(); ctx.ellipse(x + 28, y + 25, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#442c3b";
  ctx.beginPath(); ctx.arc(x + 29, y + 18, 2.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 36, y + 18, 2.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 33, y + 25, 2.4, 0, Math.PI * 2); ctx.fill();
  // Patinhas
  roundedRect(x + 8, y + 43, 12, 8, 4, "#fff0df");
  roundedRect(x + 27, y + 43, 12, 8, 4, "#fff0df");
}

function drawObstacle(o) {
  roundedRect(o.x, o.y, o.w, o.h, 7, "#9d77d8");
  roundedRect(o.x + 4, o.y + 5, o.w - 8, 7, 3, "#c5a9f1");
  ctx.fillStyle = "#7652ad";
  ctx.fillRect(o.x + 5, o.y + o.h - 7, o.w - 10, 4);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 13px Nunito";
  ctx.textAlign = "center";
  ctx.fillText("!", o.x + o.w / 2, o.y + o.h / 2 + 5);
}

function drawCoin(c) {
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.fillStyle = "#ffbd37";
  ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#f18a26"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#fff0a3";
  ctx.font = "900 16px Nunito";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("$", 0, 1);
  ctx.restore();
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / 35);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function draw() {
  drawBackground();
  for (const coin of coins) drawCoin(coin);
  for (const obstacle of obstacles) drawObstacle(obstacle);
  drawPlayer();
  drawParticles();
  if (!running && !gameOver) {
    ctx.fillStyle = "rgba(255,255,255,.7)";
    ctx.font = "800 20px Nunito";
    ctx.textAlign = "center";
    ctx.fillText("Sua aventura começa aqui!", W / 2, 225);
  }
}

function loop() {
  update();
  draw();
  if (running) animationId = requestAnimationFrame(loop);
}

startButton.addEventListener("click", startGame);
document.getElementById("restartTop").addEventListener("click", startGame);
document.getElementById("jumpButton").addEventListener("pointerdown", (event) => {
  event.preventDefault();
  jump();
});
window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
    event.preventDefault();
    if (!running && !gameOver) startGame();
    else jump();
  }
  if (event.code === "Enter" && gameOver) startGame();
});

draw();