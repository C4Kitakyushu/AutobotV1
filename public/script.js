let defaultCommands = [];

async function fetchDefaultCommands() {
  try {
    const res = await fetch('/api/available-cmds');
    const cmds = await res.json();
    defaultCommands = cmds.filter(cmd => !cmd.admin).map(cmd => cmd.name);
  } catch (error) {
    console.error("Error fetching commands:", error);
  }
}

async function fetchActiveUserCount() {
  try {
    const res = await fetch('/api/active-users');
    const data = await res.json();
    document.getElementById('userCount').innerText = `Active Users: ${data.count}`;
  } catch {
    console.warn('Could not fetch active user count.');
  }
}

async function addBot() {
  const resultDiv = document.getElementById('result');
  const addBotBtn = document.getElementById('addBotBtn');
  const loadingDiv = document.getElementById('loading');

  resultDiv.innerText = '';
  const appStateText = document.getElementById('appState').value.trim();
  const ownerUid = document.getElementById('ownerUid').value.trim();

  if (!appStateText) return alert('Please enter your appState JSON!');
  let appState;
  try {
    appState = JSON.parse(appStateText);
  } catch {
    return alert('Invalid appState JSON!');
  }

  addBotBtn.disabled = true;
  loadingDiv.style.display = 'block';

  try {
    const response = await fetch('/api/add-bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appState, ownerUid, selectedCommands: defaultCommands })
    });

    const result = await response.json();
    resultDiv.innerText = result.success
      ? `Activted successfully! Bot ID: ${result.botID} ✅`
      : `❌ Failed: ${result.error}`;

    if (result.success) fetchActiveUserCount();
  } catch (error) {
    resultDiv.innerText = `❌ Error: ${error.message}`;
  } finally {
    addBotBtn.disabled = false;
    loadingDiv.style.display = 'none';
  }
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const icon = document.getElementById('themeIcon');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
}

fetchDefaultCommands();
fetchActiveUserCount();