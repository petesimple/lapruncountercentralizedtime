let timer;
//const raceDuration = 33 * 60 + 20;
const raceDuration = 20;
let startTimestamp = null;
let lapCount = 0;
let laps = [];
let isAdmin = false;
let runnerName = 'Runner';
let totalDistanceMeters = 0;
let finalStats = '';

// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyADVThkhLVhpte3cLlFnicEJ8RqgdmdeAw",
  authDomain: "lp-run-lap-counter-timer.firebaseapp.com",
  databaseURL: "https://lp-run-lap-counter-timer-default-rtdb.firebaseio.com",
  projectId: "lp-run-lap-counter-timer",
  storageBucket: "lp-run-lap-counter-timer.appspot.com",
  messagingSenderId: "193305368481",
  appId: "1:193305368481:web:c6a9f5e65d67563be71de0"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('startButton');
const falseStartButton = document.getElementById('falseStartButton');
const resetButton = document.getElementById('resetButton');
const addLapButton = document.getElementById('addLap');
const subtractLapButton = document.getElementById('subtractLap');
const lapDisplay = document.getElementById('lapCount');
const summaryDisplay = document.getElementById('summary');
const airhorn = document.getElementById('airhorn');
const runnerNameDisplay = document.getElementById('runnerNameDisplay');
const settingsGear = document.getElementById('settingsGear');
const settingsMenu = document.getElementById('settingsMenu');

// Background
function setRandomBackground() {
  const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6FF2', '#FFA45B', '#42E2B8', '#C08497', '#F2BE22', '#7BDFF2', '#B28DFF'];
  const pickColor = () => colors[Math.floor(Math.random() * colors.length)];
  const gradient = `radial-gradient(circle at ${Math.random()*100}% ${Math.random()*100}%, ${pickColor()}, ${pickColor()}, ${pickColor()})`;
  document.body.style.setProperty('--background-gradient', gradient);
}

// Admin
function authenticateAdmin() {
  const adminCode = new URLSearchParams(window.location.search).get('admin');
  if (adminCode === 'letmein') {
    isAdmin = true;
    startButton.style.display = "inline-block";
    settingsGear.style.display = "inline-block";
  }
}

// Timer Display
function updateTimerDisplay(timeRemaining) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateRaceClock() {
  const now = Date.now();
  const elapsed = Math.floor((now - startTimestamp) / 1000);
  const timeLeft = Math.max(raceDuration - elapsed, 0);
  updateTimerDisplay(timeLeft);
  if (timeLeft <= 0) finishRace();
}

// Firebase Sync
db.ref('race/startTimestamp').on('value', (snapshot) => {
  const val = snapshot.val();
  if (val) {
    startTimestamp = val;
    clearInterval(timer);
    updateRaceClock();
    timer = setInterval(updateRaceClock, 1000);
  } else {
    clearInterval(timer);
    timer = null;
    startTimestamp = null;
    updateTimerDisplay(raceDuration);
    lapDisplay.textContent = 0;
    summaryDisplay.innerHTML = '';
  }
});

db.ref('race/resetReason').on('value', (snapshot) => {
  const reason = snapshot.val();
  if (!reason) return;
  if (reason === "masterReset") {
    runnerName = prompt("Enter the next Runner's Name:") || 'Runner';
    runnerName = runnerName.trim().replace(/\s+/g, '_');
    runnerNameDisplay.textContent = runnerName.replace(/_/g, ' ');
    alert("✅ Race fully reset. Ready for next runner!");
  }
  db.ref('race/resetReason').remove();
});

// Start / Reset
function startRace() {
  if (isAdmin) db.ref('race/startTimestamp').set(Date.now());
}

function falseStartReset() {
  if (isAdmin) {
    db.ref('race').update({ startTimestamp: null, resetReason: "falseStart" });
  }
}

function resetRace() {
  if (isAdmin) {
    db.ref('race').update({ startTimestamp: null, resetReason: "masterReset" });
  }
}

// Lap Controls
addLapButton.addEventListener('click', () => {
  lapCount++;
  lapDisplay.textContent = lapCount;
});

subtractLapButton.addEventListener('click', () => {
  if (lapCount > 0) {
    lapCount--;
    lapDisplay.textContent = lapCount;
  }
});

// Finish Race
function finishRace() {
  clearInterval(timer);
  timer = null;
  airhorn.play();
  launchConfetti();

  const lane = prompt("Lane Type? Type 'inside' or 'outside'").toLowerCase();
  const lapLength = lane === 'outside' ? 415 : 400;
  const extra = parseFloat(prompt("Extra meters completed beyond last full lap (if any):")) || 0;

  totalDistanceMeters = lapCount * lapLength + extra;
  const meters = totalDistanceMeters.toFixed(1);
  const km = (totalDistanceMeters / 1000).toFixed(2);
  const feet = (totalDistanceMeters * 3.28084).toFixed(1);
  const miles = (totalDistanceMeters / 1609.34).toFixed(2);

  const avgSec = raceDuration / (lapCount || 1);
  const avgLap = `${Math.floor(avgSec / 60)}:${Math.round(avgSec % 60).toString().padStart(2, '0')}`;

  finalStats = `
Total Distance:
${meters} meters
${km} kilometers
${feet} feet
${miles} miles

Average Lap Pace:
${avgLap} per lap
`;

  let html = `<h2>🏁 Race Results for ${runnerName.replace(/_/g, ' ')}</h2>`;
  html += `<table id="resultsTable" style="margin:auto; border-collapse: collapse;"><tr><th>Lap</th><th>Time Remaining</th></tr>`;
  for (let i = 1; i <= lapCount; i++) {
    html += `<tr><td>${i}</td><td>-</td></tr>`;
  }
  html += '</table>';
  html += `<br><strong>${finalStats.replace(/\n/g, '<br>')}</strong>`;
  html += `<br><button id="downloadCSV">Download Results CSV</button>`;
  summaryDisplay.innerHTML = html;

  document.getElementById('downloadCSV').addEventListener('click', exportTableToCSV);
}

// CSV Export
function exportTableToCSV() {
  const rows = document.querySelectorAll('#resultsTable tr');
  const csv = [];

  for (let row of rows) {
    const cols = row.querySelectorAll('td, th');
    const line = [...cols].map(col => `"${col.innerText}"`).join(',');
    csv.push(line);
  }

  csv.push('', '----- Final Stats -----');
  finalStats.trim().split('\n').forEach(line => {
    if (line.trim()) csv.push(line.replace(': ', ','));
  });

  const now = new Date();
  const filename = `lprun_${runnerName}_${now.toISOString().replace(/T/, '_').replace(/:/g, '-').split('.')[0]}.csv`;
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Confetti
function launchConfetti() {
  const end = Date.now() + 3000;
  (function frame() {
    const emoji = document.createElement('div');
    emoji.textContent = '🎉';
    emoji.style.position = 'fixed';
    emoji.style.top = Math.random() * 100 + 'vh';
    emoji.style.left = Math.random() * 100 + 'vw';
    emoji.style.fontSize = '2rem';
    emoji.style.opacity = '0.8';
    document.body.appendChild(emoji);
    setTimeout(() => emoji.remove(), 1000);
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// Settings toggle
settingsGear.addEventListener('click', () => {
  settingsMenu.style.display = settingsMenu.style.display === 'block' ? 'none' : 'block';
});

// Init
window.onload = function () {
  setRandomBackground();
  authenticateAdmin();
  lapDisplay.textContent = lapCount;
  runnerName = prompt("Enter the Runner's Name:") || 'Runner';
  runnerName = runnerName.trim().replace(/\s+/g, '_');
  runnerNameDisplay.textContent = runnerName.replace(/_/g, ' ');
};

// Event Bindings
startButton.addEventListener('click', startRace);
falseStartButton.addEventListener('click', falseStartReset);
resetButton.addEventListener('click', resetRace);
