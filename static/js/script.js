// client-side validation and interaction using fetch to /api/guess
const form = document.getElementById('guess-form');
const input = document.getElementById('guess-input');
const msg = document.getElementById('message');
const historyList = document.getElementById('history-list');
const attemptsLeftEl = document.getElementById('attempts-left');
const resetBtn = document.getElementById('reset-btn');

function showMessage(text, kind='') {
  msg.textContent = text;
  msg.style.color = kind === 'error' ? '#c0392b' : (kind === 'success' ? '#27ae60' : '#222');
}

async function sendGuess(guess) {
  try {
    const res = await fetch('/api/guess', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify({guess})
    });
    const data = await res.json();
    if (!res.ok) {
      showMessage(data.message || 'something went wrong', 'error');
      return;
    }
    // update UI
    attemptsLeftEl.textContent = data.attempts_left;
    renderHistory(data.history);
    if (data.finished) {
      showMessage(data.message, data.result === 'correct' ? 'success' : 'error');
      input.disabled = true;
      document.getElementById('guess-btn').disabled = true;
    } else {
      showMessage(data.message);
    }
  } catch (e) {
    showMessage('network error: could not reach server', 'error');
    console.error(e);
  }
}

function renderHistory(history){
  historyList.innerHTML = '';
  history.slice().reverse().forEach(item => {
    const li = document.createElement('li');
    li.textContent = 'guess: ' + item.guess;
    const span = document.createElement('span');
    span.textContent = item.result;
    li.appendChild(span);
    historyList.appendChild(li);
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const val = input.value.trim();
  if (!val) { showMessage('please enter a number', 'error'); return; }
  const n = Number(val);
  if (!Number.isInteger(n)) { showMessage('please enter a whole number', 'error'); return; }
  if (n < 1 || n > 100) { showMessage('number must be between 1 and 100', 'error'); return; }
  sendGuess(n);
  input.value = '';
});

resetBtn.addEventListener('click', () => {
  fetch('/reset', {method:'POST'}).then(()=> location.reload());
});

// try to load initial history (if any) by asking server for a harmless guess of 0 (server returns 400),
// instead we rely on progressive enhancement; history will appear after first guess.
