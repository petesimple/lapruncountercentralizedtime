let timer;
//const raceDuration = 33 * 60 + 20; // total race time in seconds
const raceDuration = 20; // total race time in seconds TEST TIMER
let startTimestamp;
let lapCount = 0;
let laps = [];
let isAdmin = false;
let runnerName = 'Runner';
let totalDistanceMeters = 0;
let finalStats = ''; // New: store full final stats

const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('startButton');
const addLapButton = document.getElementById('addLap');
const subtractLapButton = document.getElementById('subtractLap');
const resetButton = document.getElementById('resetButton');
const lapDisplay = document.getElementById('lapCount');
const summaryDisplay = document.getElementById('summary');
const airhorn = document.getElementById('airhorn');

// --- Fun Random Tie-Dye Background --- //
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

// --- Start Race --- //
function startRace() {
  if (isAdmin) {
    startTimestamp = Date.now();
    localStorage.setItem('startTimestamp', startTimestamp);
    clearInterval(timer);
    timer = setInterval(updateRaceClock, 1000);
  }
}

// --- Lap Recording Functions --- //
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

// --- Finish Race --- //
function finishRace() {
  generateResultsTable();
  launchConfetti();
  airhorn.play();

  setTimeout(askExtraDistance, 1500); // After confetti
}

// --- Ask Lane Type and Extra Distance --- //
function askExtraDistance() {
  const laneChoice = prompt("Lane Type? Type 'inside' or 'outside'").toLowerCase();
  let lapLength = 400;
  if (laneChoice === 'outside') {
    lapLength = 415;
  }

  const extraMeters = parseFloat(prompt("Extra meters completed beyond last full lap (if any):")) || 0;

  totalDistanceMeters = (lapCount * lapLength) + extraMeters;
  const totalDistanceKm = (totalDistanceMeters / 1000).toFixed(2);
  const totalDistanceFeet = (totalDistanceMeters * 3.28084).toFixed(1);
  const totalDistanceMiles = (totalDistanceMeters / 1609.34).toFixed(2);

  let avgLapSeconds = raceDuration / (lapCount || 1);
  const avgLapMinutes = Math.floor(avgLapSeconds / 60);
  const avgLapRemainSeconds = Math.round(avgLapSeconds % 60).toString().padStart(2, '0');
  const avgLapFormatted = `${avgLapMinutes}:${avgLapRemainSeconds}`;

  finalStats = `
Total Distance: 
${totalDistanceMeters.toFixed(1)} meters
${totalDistanceKm} kilometers
${totalDistanceFeet} feet
${totalDistanceMiles} miles

Average Lap Pace:
${avgLapFormatted} per lap
`;

  summaryDisplay.innerHTML += `<br><br><strong>${finalStats.replace(/\n/g, '<br>')}</strong>`;
}

// --- Results Table and Download CSV --- //
function generateResultsTable() {
  let html = `<h2>🏁 Race Results for ${runnerName.replace(/_/g, ' ')}</h2>`;
  html += '<table id="resultsTable" style="margin:auto; border-collapse: collapse;">';
  html += '<tr><th style="border:1px solid black; padding:5px;">Lap</th><th style="border:1px solid black; padding:5px;">Time Remaining</th></tr>';

  laps.forEach(lapObj => {
    html += `<tr><td style="border:1px solid black; padding:5px;">${lapObj.lap}</td><td style="border:1px solid black; padding:5px;">${lapObj.time}</td></tr>`;
  });

  html += '</table>';
  html += '<br><button id="downloadCSV" style="margin-top:10px;">Download CSV</button>';
  summaryDisplay.innerHTML = html;

  document.getElementById('downloadCSV').addEventListener('click', exportTableToCSV);
}

function exportTableToCSV() {
  const table = document.getElementById('resultsTable');
  let csv = [];
  const rows = table.querySelectorAll('tr');

  for (let i = 0; i < rows.length; i++) {
    const row = [], cols = rows[i].querySelectorAll('td, th');
    for (let j = 0; j < cols.length; j++) {
      let data = cols[j].innerText.replace(/"/g, '""');
      if (data.includes(',') || data.includes('"') || data.includes('\n')) {
        data = `"${data}"`;
      }
      row.push(data);
    }
    csv.push(row.join(','));
  }

  if (totalDistanceMeters > 0) {
    csv.push('');
    csv.push('----- Final Stats -----');
    finalStats.trim().split('\n').forEach(line => csv.push(line.replace(': ', ',')));
  }

  const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });

  const now = new Date();
  const dateStr = now.getFullYear() + '-' +
                  String(now.getMonth() + 1).padStart(2, '0') + '-' +
                  String(now.getDate()).padStart(2, '0') + '_' +
                  String(now.getHours()).padStart(2, '0') + '-' +
                  String(now.getMinutes()).padStart(2, '0') + '-' +
                  String(now.getSeconds()).padStart(2, '0');
  const filename = `lprun_${runnerName}_${dateStr}.csv`;

  const downloadLink = document.createElement('a');
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// --- Confetti Celebration --- //
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

// --- Toast Notification --- //
function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = "toast";
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 1200);
}

// --- Master Reset --- //
function resetRace() {
  if (laps.length > 0) {
    const saveFirst = confirm("Save the current race before resetting?");
    if (saveFirst) {
      exportTableToCSV();
      showToast("✅ Results Saved!");
      setTimeout(() => {
        actuallyResetRace();
      }, 1500);
      return;
    }
  }
  actuallyResetRace();
}

function actuallyResetRace() {
  clearInterval(timer);
  timer = null;
  localStorage.removeItem('startTimestamp');
  startTimestamp = null;
  lapCount = 0;
  laps = [];
  updateTimerDisplay(raceDuration);
  lapDisplay.textContent = lapCount;
  summaryDisplay.innerHTML = '';

  const newName = prompt("Enter the new Runner's Name (or OK to reuse last):");
  if (newName) {
    runnerName = newName.trim().replace(/\s+/g, '_');
  }
}

// --- Page Load --- //
window.onload = function() {
  setRandomBackground();
  authenticateAdmin();

  runnerName = prompt("Enter the Runner's Name:") || 'Runner';
  runnerName = runnerName.trim().replace(/\s+/g, '_');

  const savedTimestamp = localStorage.getItem('startTimestamp');
  if (savedTimestamp) {
    const now = Date.now();
    const elapsed = (now - parseInt(savedTimestamp, 10)) / 1000;
    if (elapsed > raceDuration) {
      localStorage.removeItem('startTimestamp');
    }
  }

  if (localStorage.getItem('startTimestamp')) {
    startTimestamp = parseInt(localStorage.getItem('startTimestamp'), 10);
    timer = setInterval(updateRaceClock, 1000);
  } else {
    updateTimerDisplay(raceDuration);
  }

  lapDisplay.textContent = lapCount;
};

// --- Event Listeners --- //
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
resetButton.addEventListener('click', resetRace);
