let timer;
const raceDuration = 33 * 60 + 20; // seconds
let startTimestamp;
let lapCount = 0;
let laps = [];

const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('startButton');
const addLapButton = document.getElementById('addLap');
const subtractLapButton = document.getElementById('subtractLap');
const lapDisplay = document.getElementById('lapCount');
const summaryDisplay = document.getElementById('summary');
const airhorn = document.getElementById('airhorn');

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
  if (!localStorage.getItem('startTimestamp')) {
    startTimestamp = Date.now();
    localStorage.setItem('startTimestamp', startTimestamp);
  } else {
    startTimestamp = parseInt(localStorage.getItem('startTimestamp'), 10);
  }
  timer = setInterval(updateRaceClock, 1000);
}

function recordLap() {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - startTimestamp) / 1000);
  const timeRemaining = Math.max(raceDuration - elapsedSeconds, 0);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const lapTime = minutes + ':' + seconds.toString().padStart(2, '0');
  laps.push('Lap ' + lapCount + ' - ' + lapTime);
  updateLapLog();
}

function updateLapLog() {
  summaryDisplay.innerHTML = laps.join('<br>');
}

function finishRace() {
  summaryDisplay.innerHTML += '<br><strong>Race Finished!</strong>';
  launchConfetti();
  airhorn.play();
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

window.onload = function() {
  if (localStorage.getItem('startTimestamp')) {
    startTimestamp = parseInt(localStorage.getItem('startTimestamp'), 10);
    timer = setInterval(updateRaceClock, 1000);
  } else {
    updateTimerDisplay(raceDuration);
  }
  lapDisplay.textContent = lapCount;
};
