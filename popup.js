// --- Deadline storage and display  ---
function saveDeadline(text, date) {
  try {
    const deadlines = JSON.parse(localStorage.getItem('deadlines') || '[]');
    deadlines.push({ text, date });
    localStorage.setItem('deadlines', JSON.stringify(deadlines));
    showCustomPopup('Deadline added!');
  } catch (e) {
    console.error('Failed to save deadline:', e);
    showCustomPopup('Error saving deadline.', 'error');
  }
}

function loadDeadlines() {
  try {
    const deadlineList = document.getElementById('deadlineList');
    const deadlines = JSON.parse(localStorage.getItem('deadlines') || '[]');
    if (deadlineList) deadlineList.innerHTML = '';
    deadlines.forEach(deadline => {
      const div = document.createElement('div');
      div.textContent = `${deadline.text} (${new Date(deadline.date).toLocaleString()})`;
      if (deadlineList) deadlineList.appendChild(div);
    });
  } catch (e) {
    console.error('Failed to load deadlines:', e);
    showCustomPopup('Error loading deadlines.', 'error');
  }
}
document.addEventListener('DOMContentLoaded', () => {
  // --- Event Add Logic (datetime-local input) ---
  const addEventBtn = document.getElementById('addEventBtn');
  const eventDateTimeInput = document.getElementById('eventDateTime');
  if (addEventBtn && eventDateTimeInput) {
    addEventBtn.addEventListener('click', async () => {
      try {
        const title = document.getElementById('eventTitle').value;
        const dateTime = eventDateTimeInput.value;
        if (!title || !dateTime) {
          showCustomPopup('Please fill out all fields.', 'error');
          return;
        }
        chrome.runtime.sendMessage({
          action: 'createEvent',
          title,
          dateTime
        }, response => {
          if (response && response.success) showCustomPopup('Event added to Google Calendar!');
          else showCustomPopup('Failed to add event.', 'error');
        });
      } catch (e) {
        console.error('Failed to add event:', e);
        showCustomPopup('Error adding event.', 'error');
      }
    });
  }

  // --- Deadline Add Logic ---
  const addDeadlineBtn = document.getElementById('addDeadlineBtn');
  const deadlineInput = document.getElementById('deadlineInput');
  const deadlineDateInput = document.getElementById('deadlineDate');
  const deadlineTimeInput = document.getElementById('deadlineTime');
  if (addDeadlineBtn && deadlineInput && deadlineDateInput && deadlineTimeInput) {
    addDeadlineBtn.addEventListener('click', () => {
      try {
        const deadline = deadlineInput.value;
        const date = deadlineDateInput.value;
        const time = deadlineTimeInput.value;
        if (deadline && date && time) {
          const dateTime = `${date}T${time}`;
          saveDeadline(deadline, dateTime);
          loadDeadlines();
          deadlineInput.value = '';
          deadlineDateInput.value = '';
          deadlineTimeInput.value = '';
        } else {
          showCustomPopup('Please fill out all deadline fields.', 'error');
        }
      } catch (e) {
        console.error('Failed to add deadline:', e);
        showCustomPopup('Error adding deadline.', 'error');
      }
    });
  }

  // --- Task List Logic ---
  const taskInput = document.getElementById('taskInput');
  const addTaskBtn = document.getElementById('addTaskBtn');
  const taskTypeSelect = document.getElementById('taskType');
  const personalTaskList = document.getElementById('personalTaskList');
  const schoolTaskList = document.getElementById('schoolTaskList');
  const personalSort = document.getElementById('personalSort');
  const schoolSort = document.getElementById('schoolSort');
  let personalSortOrder = personalSort ? personalSort.value : 'default';
  let schoolSortOrder = schoolSort ? schoolSort.value : 'default';

  function escapeHtml(text) {
  if (typeof text !== 'string') text = String(text || '');
  text = text.replace(/[^\x20-\x7E]/g, '');
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

  function loadTasks() {
    try {
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      let personal = [];
      let school = [];
      if (personalTaskList) personalTaskList.innerHTML = '';
      if (schoolTaskList) schoolTaskList.innerHTML = '';
      tasks.forEach((t, idx) => {
        let obj = typeof t === 'string' ? { text: t, type: 'personal' } : t;
        if (obj.type === 'school') {
          school.push(obj);
        } else {
          personal.push(obj);
        }
      });
      // Sorting
      if (personalSortOrder === 'az') personal.sort((a, b) => a.text.localeCompare(b.text));
      if (personalSortOrder === 'za') personal.sort((a, b) => b.text.localeCompare(a.text));
      if (schoolSortOrder === 'az') school.sort((a, b) => a.text.localeCompare(b.text));
      if (schoolSortOrder === 'za') school.sort((a, b) => b.text.localeCompare(a.text));
      function renderTaskList(list, arr, type) {
        arr.forEach(obj => {
          let div = document.createElement('div');
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.justifyContent = 'space-between';
          div.style.background = '#f8fafc';
          div.style.borderRadius = '5px';
          div.style.marginBottom = '5px';
          div.style.padding = '6px 10px';
          div.innerHTML = `<span>${escapeHtml(obj.text)}</span>`;
          let delBtn = document.createElement('button');
          delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#e74c3c"/><line x1="4.5" y1="4.5" x2="9.5" y2="9.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><line x1="9.5" y1="4.5" x2="4.5" y2="9.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';
          delBtn.style.background = 'transparent';
          delBtn.style.border = 'none';
          delBtn.style.padding = '0 4px';
          delBtn.style.marginLeft = '6px';
          delBtn.style.cursor = 'pointer';
          delBtn.style.display = 'flex';
          delBtn.style.alignItems = 'center';
          delBtn.onmouseover = () => { delBtn.style.transform = 'scale(1.15)'; };
          delBtn.onmouseout = () => { delBtn.style.transform = 'scale(1)'; };
          delBtn.onclick = () => {
            let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            let idx = tasks.findIndex(t => (typeof t === 'string' ? t === obj.text : t.text === obj.text && (t.type || type) === (obj.type || type)));
            if (idx > -1) {
              tasks.splice(idx, 1);
              localStorage.setItem('tasks', JSON.stringify(tasks));
              loadTasks();
              showCustomPopup('Task deleted.');
            }
          };
          div.appendChild(delBtn);
          if (list) list.appendChild(div);
        });
      }
      renderTaskList(personalTaskList, personal, 'personal');
      renderTaskList(schoolTaskList, school, 'school');
    } catch (e) {
      if (personalTaskList) personalTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
      if (schoolTaskList) schoolTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
      showCustomPopup('Error loading tasks.', 'error');
    }
  }

  if (addTaskBtn && taskInput && taskTypeSelect) {
    addTaskBtn.addEventListener('click', () => {
      const text = taskInput.value.trim();
      const type = taskTypeSelect.value;
      if (!text) {
        showCustomPopup('Please enter a task.','error');
        return;
      }
      let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      if (tasks.some(t => (typeof t === 'string' ? t === text : t.text === text && (t.type || 'personal') === type))) {
        showCustomPopup('Task already exists.','error');
        return;
      }
      tasks.push({ text, type });
      localStorage.setItem('tasks', JSON.stringify(tasks));
      taskInput.value = '';
      taskTypeSelect.value = 'personal';
      loadTasks();
      showCustomPopup('Task added!');
    });
  }

  if (personalSort) {
    personalSort.addEventListener('change', function(e) {
      personalSortOrder = e.target.value;
      loadTasks();
    });
  }
  if (schoolSort) {
    schoolSort.addEventListener('change', function(e) {
      schoolSortOrder = e.target.value;
      loadTasks();
    });
  }

  // Initial load
  loadTasks();

  // --- Deadline/Reminder logic ---
  loadDeadlines();
  populateDateTimeDropdowns();
  showDeadlineReminderIfNeeded();

  // Google Calendar Client ID save/load
  const gcalInput = document.getElementById('gcalClientId');
  const gcalBtn = document.getElementById('saveGcalBtn');
  if (gcalInput) {
    const savedId = localStorage.getItem('gcalClientId');
    if (savedId) gcalInput.value = savedId;
  }
  if (gcalBtn) {
    gcalBtn.addEventListener('click', () => {
      const val = gcalInput && gcalInput.value ? gcalInput.value.trim() : '';
      if (val) {
        localStorage.setItem('gcalClientId', val);
        showCustomPopup('Google Calendar Client ID saved!');
      } else {
        showCustomPopup('Please enter a valid Client ID.', 'error');
      }
    });
  }

  // --- Reminder toggle logic ---
  const reminderToggle = document.getElementById('reminderToggle');
  if (reminderToggle && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['reminderToggle'], (result) => {
      reminderToggle.checked = result.reminderToggle !== false;
    });
    reminderToggle.addEventListener('change', () => {
      chrome.storage.local.set({ reminderToggle: reminderToggle.checked });
    });
  }
});

// Custom visually appealing popup system
function showCustomPopup(message, type = 'info') {
  try {
    // Remove any existing popup
    const oldPopup = document.getElementById('student-organizer-popup');
    if (oldPopup) oldPopup.remove();

    const popup = document.createElement('div');
    popup.id = 'student-organizer-popup';
    // Place popup at bottom right of the whole screen (viewport)
    popup.style.position = 'fixed';
    popup.style.bottom = '30px';
    popup.style.right = '30px';
    popup.style.left = 'auto';
    popup.style.top = 'auto';
    popup.style.transform = 'none';
    popup.style.zIndex = 2147483647; // highest z-index to ensure visibility
    popup.style.background = type === 'error'
      ? 'linear-gradient(90deg, #e74c3c 60%, #ff7675 100%)'
      : 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
    popup.style.color = '#fff';
    popup.style.padding = '18px 32px 16px 24px';
    popup.style.borderRadius = '12px';
    popup.style.boxShadow = '0 4px 16px rgba(45,108,223,0.13)';
    popup.style.fontSize = '16px';
    popup.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    popup.style.fontWeight = '500';
    popup.style.maxWidth = '340px';
    popup.style.pointerEvents = 'auto';
    popup.style.transition = 'opacity 0.3s';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.gap = '12px';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = '#fff';
    closeBtn.style.fontSize = '22px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.padding = '0 8px 0 0';
    closeBtn.setAttribute('aria-label', 'Close popup');
    closeBtn.onclick = () => popup.remove();

    // Icon
    const icon = document.createElement('span');
    icon.innerHTML = type === 'error' ? '&#9888;' : '&#9432;';
    icon.style.fontSize = '20px';

    // Message
    const msg = document.createElement('span');
    msg.textContent = message;

    popup.appendChild(icon);
    popup.appendChild(msg);
    popup.appendChild(closeBtn);

    document.body.appendChild(popup);

    setTimeout(() => {
      popup.style.opacity = '0.0';
      setTimeout(() => popup.remove(), 400);
    }, 4000);
  } catch (e) {
    // fallback if popup fails
    alert(message);
  }
}

