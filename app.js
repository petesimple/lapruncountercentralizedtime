let timer;
const raceDuration = 33 * 60 + 20; // total race time in seconds
let startTimestamp;
let lapCount = 0;
let laps = [];
let isAdmin = false; // Admin control flag

const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('startButton');
const addLapButton = document.getElementById('addLap');
const subtractLapButton = document.getElementById('subtractLap');
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

// --- Admin Authentication via URL --- //
function authenticateAdmin() {
  const urlParams = new URLSearchParams(window.location.search);
  const adminCode = urlParams.get('admin');
  if (adminCode === 'letmein') { // << You can change 'letmein' to any secret you want
    isAdmin = true;
    startButton.style.display = "inline-block";
  } else {
    isAdmin = false;
    startButton.style.display = "none";
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

// --- Race Finish --- //
function finishRace() {
  generateResultsTable();
  launchConfetti();
  airhorn.play();
}

// --- Results Table and Download CSV --- //
function generateResultsTable() {
  let html = '<h2>🏁 Race Results</h2>';
  html += '<table id="resultsTable" style="margin:auto; border-collapse: collapse;">';
  html += '<tr><th style="border:1px solid black; padding:5px;">Lap</th><th style="border:1px solid black; padding:5px;">Time Remaining</th></tr>';

  laps.forEach(lapObj => {
    html += `<tr><td style="border:1px solid black; padding:5px;">${lapObj.lap}</td><td style="border:1px solid black; padding:5px;">${lapObj.time}</td></tr>`;
  });

  html += '</table>';
  html += '<br><button id="downloadCSV" style="margin-top:10px;">Download CSV</button>';
  summaryDisplay.innerHTML = html;

  // Add event listener for download button
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

  const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
  const downloadLink = document.createElement('a');
  downloadLink.download = 'lap_results.csv';
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

// --- On Page Load --- //
window.onload = function() {
  setRandomBackground();  // 🎨 Colorful background first!
  authenticateAdmin();

  if (localStorage.getItem('startTimestamp')) {
    startTimestamp = parseInt(localStorage.getItem('startTimestamp'), 10);
    timer = setInterval(updateRaceClock, 1000);
  } else {
    updateTimerDisplay(raceDuration);
  }
  lapDisplay.textContent = lapCount;
};
