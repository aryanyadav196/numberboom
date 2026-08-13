let targetNumber = 0;
let score = 0;
let selectedTimer = 15; // Default Timer
let timeLeft = 15;
let isPaused = false;
let soundEnabled = true;

let timerInterval = null;
let spawnInterval = null;
let highScore = localStorage.getItem('sh_highscore') || 0;

// Balanced Pacing Limits (Prevents frustration)
let spawnRate = 750;       // Relaxed initial spawn speed
let buttonLifespan = 1400; // Increased button visibility time on screen

// Counter for Guaranteed Target Spawn (Prevents unfair missing targets)
let failedTargetSpawns = 0;

const gameStage = document.getElementById('game-stage');
const targetDisplay = document.getElementById('target-num');
const scoreDisplay = document.getElementById('current-score');
const timerDisplay = document.getElementById('timer-val');
const highScoreDisplay = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('overlay-msg');
const overlaySubmsg = document.getElementById('overlay-submsg');
const playerNameDisplay = document.getElementById('player-name');
const playerAvatarDisplay = document.getElementById('player-avatar');
const modalAvatar = document.getElementById('modal-avatar');
const pauseBtn = document.getElementById('pause-btn');
const soundBtn = document.getElementById('sound-btn');

highScoreDisplay.innerText = highScore;

const FUNNY_NAMES = ["Star Voyager", "Galactic Popat", "Space Cadet", "Pro Jhatpat", "Rocket Raja", "Focus Baba"];
const FUNNY_AVATARS = ["🛸", "🧑‍🚀", "🚀", "🪐", "⭐", "👽", "👾"];
const FAKE_MESSAGES = ["Alien Fake!", "Nazar Hati!", "Click Me!", "Fake Hu!", "Nope 😜"];

// Space Retro Synth Sound Engine
const AudioEngine = {
  ctx: null,
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
  play(freq, type = 'sine', duration = 0.1, gainVal = 0.1) {
    if (!this.ctx || !soundEnabled) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e) {}
  },
  pop() { this.play(580, 'sine', 0.05, 0.04); },
  win() {
    this.play(523.25, 'triangle', 0.08, 0.15);
    setTimeout(() => this.play(659.25, 'triangle', 0.1, 0.15), 60);
    setTimeout(() => this.play(783.99, 'triangle', 0.15, 0.2), 120);
  },
  wrong() { this.play(130, 'sawtooth', 0.25, 0.2); }
};

function assignRandomIdentity() {
  const name = FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
  const avatar = FUNNY_AVATARS[Math.floor(Math.random() * FUNNY_AVATARS.length)];
  playerNameDisplay.innerText = name;
  playerAvatarDisplay.innerText = avatar;
  modalAvatar.innerText = avatar;
}

function setTimerOption(seconds, btnElement) {
  selectedTimer = seconds;
  document.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
  btnElement.classList.add('active');
}

function getRandomNum(min = 1, max = 999) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startGame() {
  AudioEngine.init();
  assignRandomIdentity();
  overlay.style.display = 'none';
  document.body.classList.remove('shake');
  gameStage.innerHTML = '';
  
  score = 0;
  timeLeft = selectedTimer;
  isPaused = false;
  pauseBtn.innerText = "⏸️";
  
  // Pacing Reset
  spawnRate = 750;
  buttonLifespan = 1400;
  failedTargetSpawns = 0;
  
  scoreDisplay.innerText = score;
  timerDisplay.innerText = `${timeLeft}s`;

  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);

  nextRound();
}

function updateTimer() {
  if (isPaused) return;
  timeLeft--;
  timerDisplay.innerText = `${timeLeft}s`;
  if (timeLeft <= 0) {
    gameOver("⏱️ TIME EXPIRED! Fast Taps Ki Zaroorat Thi!");
  }
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseBtn.innerText = "▶️";
    overlayMsg.innerText = "⏸️ MISSION PAUSED";
    overlaySubmsg.innerText = "Take a breath and continue when ready!";
    document.getElementById('btn-text').innerText = "RESUME MISSION";
    overlay.style.display = 'flex';
  } else {
    pauseBtn.innerText = "⏸️";
    overlay.style.display = 'none';
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundBtn.innerText = soundEnabled ? "🔊" : "🔇";
}

function restartGame() {
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  startGame();
}

function goHome() {
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  gameStage.innerHTML = '';
  overlayMsg.innerText = "Space Number Boom";
  overlaySubmsg.innerText = "Select your timer and test your speed & focus!";
  document.getElementById('btn-text').innerText = "START GAME";
  overlay.style.display = 'flex';
}

function nextRound() {
  targetNumber = getRandomNum();
  targetDisplay.innerText = targetNumber;
  failedTargetSpawns = 0; // Reset counter for new target

  if (spawnInterval) clearInterval(spawnInterval);
  spawnInterval = setInterval(spawnButton, spawnRate);
}

function spawnButton() {
  if (isPaused) return;

  const btn = document.createElement('button');
  btn.className = 'hunt-btn';

  const roll = Math.random();
  
  // Rule: Agar 3 baar continuously target miss hua, toh next button MANDATORY Target hoga
  const forceTarget = failedTargetSpawns >= 3;

  if (!forceTarget && roll < 0.15) {
    // Fake Space Decoy
    btn.classList.add('fake-btn');
    btn.innerText = FAKE_MESSAGES[Math.floor(Math.random() * FAKE_MESSAGES.length)];
    btn.onclick = () => {
      AudioEngine.wrong();
      timeLeft = Math.max(0, timeLeft - 2);
      timerDisplay.innerText = `${timeLeft}s`;
      btn.remove();
    };
    failedTargetSpawns++;
  } else if (!forceTarget && roll < 0.22) {
    // Space Mine / Bomb Button
    btn.classList.add('bomb-btn');
    btn.innerText = 'MINE';
    btn.onclick = () => {
      AudioEngine.wrong();
      gameOver("💥 BOOM! Space Mine Click Ho Gaya!");
    };
    failedTargetSpawns++;
  } else {
    // Number UFO Spawn Logic
    let isTarget = false;

    if (forceTarget) {
      isTarget = true; // Forced Target
    } else {
      isTarget = Math.random() < 0.38; // Slightly increased chance
    }

    if (isTarget) {
      btn.innerText = targetNumber;
      failedTargetSpawns = 0; // Target aa gaya, counter reset
    } else {
      btn.innerText = getRandomNum();
      failedTargetSpawns++; // Non-target increment
    }

    btn.onclick = () => {
      if (parseInt(btn.innerText) === targetNumber) {
        handleSuccess();
      } else {
        AudioEngine.wrong();
        gameOver("❌ GHALAT UFO! Focus Hato Toh Khel Khatam!");
      }
    };
  }

  const size = 90;
  const maxX = gameStage.clientWidth - size - 20;
  const maxY = gameStage.clientHeight - size - 20;
  btn.style.left = `${Math.max(15, Math.floor(Math.random() * maxX))}px`;
  btn.style.top = `${Math.max(15, Math.floor(Math.random() * maxY))}px`;

  gameStage.appendChild(btn);
  AudioEngine.pop();

  setTimeout(() => {
    if (btn.parentNode && !isPaused) btn.remove();
  }, buttonLifespan);
}

function handleSuccess() {
  AudioEngine.win();
  score++;
  
  // 1. Add +10s Bonus
  timeLeft += 10;

  // 2. Cap Timer at Selected Timer
  if (timeLeft > selectedTimer) {
    timeLeft = selectedTimer;
  }

  scoreDisplay.innerText = score;
  timerDisplay.innerText = `${timeLeft}s`;

  if (score > highScore) {
    highScore = score;
    localStorage.setItem('sh_highscore', highScore);
    highScoreDisplay.innerText = highScore;
  }

  // 3. Smooth Dynamic Speed Scaling (Min bounds set to stay playable)
  if (spawnRate > 400) spawnRate -= 10;        
  if (buttonLifespan > 950) buttonLifespan -= 10; 

  if (typeof confetti === "function") {
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
  }

  gameStage.innerHTML = '';
  nextRound();
}

function gameOver(reason) {
  clearInterval(spawnInterval);
  clearInterval(timerInterval);
  document.body.classList.add('shake');
  gameStage.innerHTML = '';

  overlayMsg.innerText = "GAME OVER!";
  overlaySubmsg.innerText = `${reason} | Final Score: ${score}`;
  document.getElementById('btn-text').innerText = "TRY AGAIN";
  overlay.style.display = 'flex';
}