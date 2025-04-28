let timer;
const raceDuration = 33 * 60 + 20;
let startTimestamp;
let lapCount = 0;
let laps = [];
let isAdmin = false; // New flag!

const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('startButton');
const addLapButton = document.getElementById('addLap');
const subtractLapButton = document.getElementById('subtractLap');
const lapDisplay = document.getElementById('lapCount');
const summaryDisplay = document.getElementById('summary');
const airhorn = document.getElementById('airhorn');

// --- Admin Protection --- //
function authenticateAdmin() {
  const answer = prompt("Admin access? Enter code:");
  if (answer === "letmein") {
    isAdmin = true;
    startButton.style.display = "inline-block"; // Show button
  } else {
    isAdmin = false;
    startButton.style.display = "none"; // Hide button
  }
}

// --- Timer Functions --- //
function updateTimerDisplay(timeRemaining) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = minutes + ':' + seconds.toString().padStart(2, '0');
}

function updateRaceClock() {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
  const timeRemaining = Math.max(raceDuration - elapsedSeconds, 0);
  updateTimerDisplay(timeRemaining);

  if (timeRemaining <= 0) {
    clearInterval(timer);
    finishRace();
  }
}

function startRace() {
  if (!localStorage.getItem('startTimestamp') && isAdmin) {
    startTimestamp = Date.now();
    localStorage.setItem('startTimestamp', startTimestamp);
    timer = setInterval(updateRaceClock, 1000);
  }
}

function recordLap() {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
  const timeRemaining = Math.max(raceDuration - elapsedSeconds, 0);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const lapTime = minutes + ':' + seconds.toString().padStart(2, '0');
  laps.push({ lap: lapCount, time: lapTime });
  updateLapLog();
}

function updateLapLog() {
  if (timer) {
    summaryDisplay.innerHTML = laps.map(lapObj =>
      'Lap ' + lapObj.lap + ' - ' + lapObj.time
    ).join('<br>');
  }
}

function finishRace() {
  generateResultsTable();
  launchConfetti();
  airhorn.play();
}

function generateResultsTable() {
  let html = '<h2>🏁 Race Results</h2>';
  html += '<table style="margin:auto; border-collapse: collapse;">';
  html += '<tr><th style="border:1px solid black; padding:5px;">Lap</th><th style="border:1px solid black; padding:5px;">Time Remaining</th></tr>';

  laps.forEach(lapObj => {
    html += '<tr><td style="border:1px solid black; padding:5px;">' + lapObj.lap + '</td><td style="border:1px solid black; padding:5px;">' + lapObj.time + '</td></tr>';
  });

  html += '</table>';
  summaryDisplay.innerHTML = html;
}

function launchConfetti() {
  const duration = 3 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    const emoji = document.createElement('div');
    emoji.textContent = '🎉';
    emoji.style.position = 'fixed';
    emoji.style.top = Math.random() * 100 + 'vh';
    emoji.style.left = Math.random() * 100 + 'vw';
    emoji.style.fontSize = '2rem';
    emoji.style.opacity = '0.8';
    document.body.appendChild(emoji);

    setTimeout(() => {
      emoji.remove();
    }, 1000);

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// --- Button Listeners --- //
startButton.addEventListener('click', startRace);
addLapButton.addEventListener('click', function() {
  lapCount++;
  lapDisplay.textContent = lapCount;
  recordLap();
});
subtractLapButton.addEventListener('click', function() {
  if (lapCount > 0) {
    lapCount--;
    lapDisplay.textContent = lapCount;
    laps.pop();
    updateLapLog();
  }
});

// --- On Load --- //
window.onload = function() {
  authenticateAdmin();
  
  if (localStorage.getItem('startTimestamp')) {
    startTimestamp = parseInt(localStorage.getItem('startTimestamp'), 10);
    timer = setInterval(updateRaceClock, 1000);
  } else {
    updateTimerDisplay(raceDuration);
  }
  lapDisplay.textContent = lapCount;
};
