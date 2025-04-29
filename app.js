let timer;
const raceDuration = 33 * 60 + 20; // total race time in seconds
let startTimestamp = null;
let lapCount = 0;
let laps = [];
let isAdmin = false;
let runnerName = 'Runner';
let totalDistanceMeters = 0;
let finalStats = '';

// --- Firebase Configuration --- //
const firebaseConfig = {
  apiKey: "AIzaSyADVThkhLVhpte3cLlFnicEJ8RqgdmdeAw",
  authDomain: "lp-run-lap-counter-timer.firebaseapp.com",
  databaseURL: "https://lp-run-lap-counter-timer-default-rtdb.firebaseio.com",
  projectId: "lp-run-lap-counter-timer",
  storageBucket: "lp-run-lap-counter-timer.appspot.com",
  messagingSenderId: "193305368481",
  appId: "1:193305368481:web:c6a9f5e65d67563be71de0",
  measurementId: "G-9GK9KLR793"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- DOM Elements --- //
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('startButton');
const addLapButton = document.getElementById('addLap');
const subtractLapButton = document.getElementById('subtractLap');
const resetButton = document.getElementById('resetButton');
const lapDisplay = document.getElementById('lapCount');
const summaryDisplay = document.getElementById('summary');
const airhorn = document.getElementById('airhorn');
const runnerNameDisplay = document.getElementById('runnerNameDisplay');

// --- Tie-Dye Background --- //
function setRandomBackground() {
  const colors = [
    '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
    '#FF6FF2', '#FFA45B', '#42E2B8', '#C08497',
    '#F2BE22', '#7BDFF2', '#B28DFF'
  ];
  const pickColor = () => colors[Math.floor(Math.random() * colors.length)];
  const gradient = `radial-gradient(circle at ${Math.floor(Math.random() * 100)}% ${Math.floor(Math.random() * 100)}%, 
    ${pickColor()}, ${pickColor()}, ${pickColor()})`;
  document.body.style.setProperty('--background-gradient', gradient);
}

// --- Admin Authentication --- //
function authenticateAdmin() {
  const urlParams = new URLSearchParams(window.location.search);
  const adminCode = urlParams.get('admin');
  if (adminCode === 'letmein') {
    isAdmin = true;
    startButton.style.display = "inline-block";
    resetButton.style.display = "inline-block";
  } else {
    isAdmin = false;
    startButton.style.display = "none";
    resetButton.style.display = "none";
  }
}

// --- Timer Display Update --- //
function updateTimerDisplay(timeRemaining) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  timerDisplay.textContent = minutes + ':' + seconds.toString().padStart(2, '0');
}

// --- Timer Countdown --- //
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

// --- Admin Starts Race --- //
function startRace() {
  if (isAdmin) {
    const now = Date.now();
    db.ref('race/startTimestamp').set(now);
  }
}

// --- Listen for StartTimestamp from Firebase --- //
db.ref('race/startTimestamp').on('value', (snapshot) => {
  const value = snapshot.val();
  if (value) {
    // Start clock normally
    startTimestamp = value;

    if (timer) {
      clearInterval(timer);
    }
    updateRaceClock();
    timer = setInterval(updateRaceClock, 1000);
  } else {
    // If startTimestamp is deleted (null), reset everything
    clearInterval(timer);
    timer = null;
    startTimestamp = null;
    updateTimerDisplay(raceDuration);
    lapDisplay.textContent = 0;
    summaryDisplay.innerHTML = '';
    console.log("Timer reset because startTimestamp was cleared.");
  }
});

// --- Race Finish --- //
function finishRace() {
  clearInterval(timer);
  timer = null;
  timerDisplay.textContent = "Race Finished!";
  airhorn.play();
}

// --- Proper Master Reset (with New Runner Prompt) --- //
function resetRace() {
  if (isAdmin) {
    db.ref('race/startTimestamp').remove().then(() => {
      clearInterval(timer);
      timer = null;
      startTimestamp = null;
      lapCount = 0;
      laps = [];
      updateTimerDisplay(raceDuration);
      lapDisplay.textContent = lapCount;
      summaryDisplay.innerHTML = '';

      // Ask for new runner name after reset
      runnerName = prompt("Enter the next Runner's Name:") || 'Runner';
      runnerName = runnerName.trim().replace(/\s+/g, '_');
      runnerNameDisplay.textContent = runnerName.replace(/_/g, ' ');

      alert("✅ Race has been reset. Ready for next runner!");
    }).catch((error) => {
      console.error("Reset failed:", error);
    });
  }
}

// --- Page Load --- //
window.onload = function() {
  setRandomBackground();
  authenticateAdmin();
  lapDisplay.textContent = lapCount;

  runnerName = prompt("Enter the Runner's Name:") || 'Runner';
  runnerName = runnerName.trim().replace(/\s+/g, '_');
  runnerNameDisplay.textContent = runnerName.replace(/_/g, ' ');
};

// --- Event Listeners --- //
startButton.addEventListener('click', startRace);
addLapButton.addEventListener('click', function() {
  lapCount++;
  lapDisplay.textContent = lapCount;
});
subtractLapButton.addEventListener('click', function() {
  if (lapCount > 0) {
    lapCount--;
    lapDisplay.textContent = lapCount;
  }
});
resetButton.addEventListener('click', resetRace);
