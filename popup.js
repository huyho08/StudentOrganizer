document.getElementById('addEventBtn').addEventListener('click', async () => {
  try {
    const title = document.getElementById('eventTitle').value;
    const year = document.getElementById('eventYear').value;
    const month = document.getElementById('eventMonth').value;
    const day = document.getElementById('eventDay').value;
    const hour = document.getElementById('eventHour').value;
    const minute = document.getElementById('eventMinute').value;
    const dateTime = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${minute}`;

    if (!title) {
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

// Store deadlines in localStorage and show the closest deadline as a reminder

// Assume you add these to your HTML near the deadline input:
// <input id="deadlineDate" type="date">
// <input id="deadlineTime" type="time">

const deadlineInput = document.getElementById('deadlineInput');
const deadlineDateInput = document.getElementById('deadlineDate');
const deadlineTimeInput = document.getElementById('deadlineTime');
const deadlineList = document.getElementById('deadlineList');

// Helper to escape HTML special characters in user input
function escapeHtml(text) {
  if (typeof text !== 'string') text = String(text || '');
  // Remove any non-printable/control characters except space and printable ASCII
  text = text.replace(/[^\x20-\x7E]/g, '');
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper to load deadlines from localStorage
function loadDeadlines() {
  try {
    const deadlines = JSON.parse(localStorage.getItem('deadlines') || '[]');
    deadlineList.innerHTML = '';
    deadlines.forEach(deadline => {
      const div = document.createElement('div');
      div.innerHTML = `<strong>- ${escapeHtml(deadline.text || '')}</strong><br><span style="font-size:12px;color:#555;">${deadline.date ? new Date(deadline.date).toLocaleString() : ''}</span>`;
      deadlineList.appendChild(div);
    });
    if (chrome.storage && chrome.storage.local && chrome.storage.local.set) {
      chrome.storage.local.set({ deadlines });
    }
    return deadlines;
  } catch (e) {
    console.error('Failed to load deadlines:', e);
    deadlineList.innerHTML = '<div style="color:red;">Error loading deadlines.</div>';
    showCustomPopup('Error loading deadlines.', 'error');
    return [];
  }
}

// Helper to save deadlines to localStorage and chrome.storage.local
function saveDeadline(text, date) {
  try {
    if (typeof text !== 'string') text = String(text || '');
    text = text.replace(/[^\x20-\x7E]/g, '');
    const deadlines = JSON.parse(localStorage.getItem('deadlines') || '[]');
    deadlines.push({ text, date });
    localStorage.setItem('deadlines', JSON.stringify(deadlines));
    if (chrome.storage && chrome.storage.local && chrome.storage.local.set) {
      chrome.storage.local.set({ deadlines });
    }
    showCustomPopup('Deadline added!');
  } catch (e) {
    console.error('Failed to save deadline:', e);
    showCustomPopup('Error saving deadline.', 'error');
  }
}

// --- Add this function to populate date/time dropdowns ---
function populateDateTimeDropdowns() {
  const now = new Date();
  // Year dropdown (current year +/- 2)
  const yearSelect = document.getElementById('eventYear');
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 2; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.text = y;
    if (y === now.getFullYear()) opt.selected = true;
    yearSelect.appendChild(opt);
  }
  // Month dropdown (1-12)
  const monthSelect = document.getElementById('eventMonth');
  for (let m = 1; m <= 12; m++) {
    const opt = document.createElement('option');
    opt.value = m;
    opt.text = m;
    if (m === now.getMonth() + 1) opt.selected = true;
    monthSelect.appendChild(opt);
  }
  // Day dropdown (1-31)
  const daySelect = document.getElementById('eventDay');
  for (let d = 1; d <= 31; d++) {
    const opt = document.createElement('option');
    opt.value = d;
    opt.text = d;
    if (d === now.getDate()) opt.selected = true;
    daySelect.appendChild(opt);
  }
  // Hour dropdown (0-23)
  const hourSelect = document.getElementById('eventHour');
  for (let h = 0; h < 24; h++) {
    const opt = document.createElement('option');
    opt.value = h.toString().padStart(2, '0');
    opt.text = h.toString().padStart(2, '0');
    if (h === now.getHours()) opt.selected = true;
    hourSelect.appendChild(opt);
  }
  // Minute dropdown (0, 5, 10, ..., 55)
  const minuteSelect = document.getElementById('eventMinute');
  for (let m = 0; m < 60; m += 5) {
    const opt = document.createElement('option');
    opt.value = m.toString().padStart(2, '0');
    opt.text = m.toString().padStart(2, '0');
    if (m === Math.floor(now.getMinutes() / 5) * 5) opt.selected = true;
    minuteSelect.appendChild(opt);
  }
}

// --- Task List Implementation ---

// Add a dropdown for task type (personal/school)
const taskTypeSelect = document.getElementById('taskType'); // Assume you add <select id="taskType"><option value="personal">Personal</option><option value="school">School</option></select> in HTML

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const personalTaskList = document.getElementById('personalTaskList'); // Assume you add <div id="personalTaskList"></div> in HTML
const schoolTaskList = document.getElementById('schoolTaskList');     // Assume you add <div id="schoolTaskList"></div> in HTML

let personalTasks = [];
let schoolTasks = [];
let personalSortOrder = 'default';
let schoolSortOrder = 'default';

function loadTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    personalTasks = [];
    schoolTasks = [];
    if (personalTaskList) personalTaskList.innerHTML = '';
    if (schoolTaskList) schoolTaskList.innerHTML = '';
    tasks.forEach((taskObj, idx) => {
      // Backward compatibility: if taskObj is a string, treat as personal
      let task, type;
      if (typeof taskObj === 'string') {
        task = taskObj.replace(/[^\x20-\x7E]/g, '');
        type = 'personal';
      } else {
        task = (taskObj.text || '').replace(/[^\x20-\x7E]/g, '');
        type = taskObj.type || 'personal';
      }
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'space-between';
      div.style.background = '#f8fafc';
      div.style.borderRadius = '5px';
      div.style.marginBottom = '5px';
      div.style.padding = '6px 10px';
      div.innerHTML = `<span>${escapeHtml(task)}</span>`;
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="#e74c3c"/><line x1="6" y1="6" x2="12" y2="12" stroke="#fff" stroke-width="2" stroke-linecap="round"/><line x1="12" y1="6" x2="6" y2="12" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>';
      delBtn.style.background = 'transparent';
      delBtn.style.border = 'none';
      delBtn.style.padding = '0';
      delBtn.style.marginLeft = '10px';
      delBtn.style.cursor = 'pointer';
      delBtn.style.display = 'flex';
      delBtn.style.alignItems = 'center';
      delBtn.style.transition = 'transform 0.15s';
      delBtn.onmouseover = () => { delBtn.style.transform = 'scale(1.15)'; };
      delBtn.onmouseout = () => { delBtn.style.transform = 'scale(1)'; };
      delBtn.onclick = () => {
        try {
          tasks.splice(idx, 1);
          localStorage.setItem('tasks', JSON.stringify(tasks));
          loadTasks();
          showCustomPopup('Task deleted.');
        } catch (e) {
          console.error('Failed to delete task:', e);
          showCustomPopup('Error deleting task.', 'error');
        }
      };
      div.appendChild(delBtn);
      if (type === 'school' && schoolTaskList) {
        schoolTaskList.appendChild(div);
      } else if (personalTaskList) {
        personalTaskList.appendChild(div);
      }
    });
  } catch (e) {
    console.error('Failed to load tasks:', e);
    if (personalTaskList) personalTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
    if (schoolTaskList) schoolTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
    showCustomPopup('Error loading tasks.', 'error');
  }
}

function renderTasks() {
  renderTaskList('personalTaskList', personalTasks, personalSortOrder);
  renderTaskList('schoolTaskList', schoolTasks, schoolSortOrder);
}

function renderTaskList(listId, tasks, sortOrder) {
  let sortedTasks = [...tasks];
  if (sortOrder === 'az') {
    sortedTasks.sort((a, b) => a.text.localeCompare(b.text));
  } else if (sortOrder === 'za') {
    sortedTasks.sort((a, b) => b.text.localeCompare(a.text));
  }
  const list = document.getElementById(listId);
  list.innerHTML = '';
  sortedTasks.forEach((task, idx) => {
    const div = document.createElement('div');
    div.textContent = task.text;
    // ...add delete/edit buttons if needed...
    list.appendChild(div);
  });
}

if (addTaskBtn && taskInput) {
  addTaskBtn.addEventListener('click', () => {
    try {
      let val = taskInput.value.trim();
      // --- Keyword-based auto-sorting ---
      const schoolKeywords = ['homework', 'assignment', 'exam', 'class', 'lecture', 'project', 'quiz'];
      let type = (taskTypeSelect && taskTypeSelect.value) || '';
      // Always auto-detect based on keywords, regardless of dropdown selection
      const lowerVal = val.toLowerCase();
      type = schoolKeywords.some(kw => lowerVal.includes(kw)) ? 'school' : 'personal';
      if (val) {
        val = val.replace(/[^\x20-\x7E]/g, '');
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        // If old format (array of strings), convert to array of objects
        if (tasks.length && typeof tasks[0] === 'string') {
          tasks = tasks.map(t => ({ text: t, type: 'personal' }));
        }
        tasks.push({ text: val, type });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        taskInput.value = '';
        if (taskTypeSelect) taskTypeSelect.value = 'personal';
        loadTasks();
        showCustomPopup('Task added!');
      }
    } catch (e) {
      console.error('Failed to add task:', e);
      showCustomPopup('Error adding task.', 'error');
    }
  });
}

// Sorting event listeners
document.getElementById('personalSort').addEventListener('change', function(e) {
  personalSortOrder = e.target.value;
  renderTasks();
});
document.getElementById('schoolSort').addEventListener('change', function(e) {
  schoolSortOrder = e.target.value;
  renderTasks();
});

// Reminder system: show a custom popup for the closest deadline when the popup is opened from a new tab
function showDeadlineReminderIfNeeded() {
  try {
    // Only show if we're in a new tab page (chrome-extension or chrome://newtab or about:newtab)
    const isNewTab = (
      window.location.href.startsWith('chrome://newtab') ||
      window.location.href.startsWith('about:newtab') ||
      window.location.protocol === 'chrome-extension:'
    );
    // Or always show if you want reminders on every popup open:
    // const isNewTab = true;

    if (isNewTab) {
      const deadlines = JSON.parse(localStorage.getItem('deadlines') || '[]');
      if (!deadlines.length) return;
      const now = new Date();
      let closest = null;
      let minDiff = Infinity;
      deadlines.forEach(d => {
        if (!d.date) return;
        const diff = new Date(d.date) - now;
        if (diff >= 0 && diff < minDiff) {
          minDiff = diff;
          closest = d;
        }
      });
      if (closest) {
        showCustomPopup(
          `Upcoming deadline: ${escapeHtml(closest.text)} (${new Date(closest.date).toLocaleString()})`,
          'info'
        );
      }
    }
  } catch (e) {
    console.error('Failed to show deadline reminder:', e);
  }
}

// --- Call this on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  try {
    loadDeadlines();
    populateDateTimeDropdowns();
    loadTasks();

    // Show reminder for closest deadline when popup is opened (new tab)
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
        try {
          const val = gcalInput.value.trim();
          if (val) {
            localStorage.setItem('gcalClientId', val);
            showCustomPopup('Google Calendar Client ID saved!');
          } else {
            showCustomPopup('Please enter a valid Client ID.', 'error');
          }
        } catch (e) {
          console.error('Failed to save Google Calendar Client ID:', e);
          showCustomPopup('Error saving Google Calendar Client ID.', 'error');
        }
      });
    }

    // --- Reminder toggle logic ---
    const reminderToggle = document.getElementById('reminderToggle');

    // Load toggle state from chrome.storage.local
    if (reminderToggle) {
      chrome.storage && chrome.storage.local && chrome.storage.local.get(['reminderToggle'], (result) => {
        reminderToggle.checked = result.reminderToggle !== false;
      });
      reminderToggle.addEventListener('change', () => {
        chrome.storage && chrome.storage.local && chrome.storage.local.set({ reminderToggle: reminderToggle.checked });
      });
    }
  } catch (e) {
    console.error('Initialization error:', e);
    showCustomPopup('Error initializing popup.', 'error');
  }
});

document.getElementById('addDeadlineBtn').addEventListener('click', () => {
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

// Task List Implementation
document.addEventListener('DOMContentLoaded', function() {
  let personalTasks = [];
  let schoolTasks = [];
  let personalSortOrder = 'default';
  let schoolSortOrder = 'default';

  function renderTaskList(listId, tasks, sortOrder) {
    let sortedTasks = [...tasks];
    if (sortOrder === 'az') {
      sortedTasks.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortOrder === 'za') {
      sortedTasks.sort((a, b) => b.text.localeCompare(a.text));
    }
    const list = document.getElementById(listId);
    list.innerHTML = '';
    sortedTasks.forEach(task => {
      const div = document.createElement('div');
      div.textContent = task.text;
      list.appendChild(div);
    });
  }

  function renderTasks() {
    renderTaskList('personalTaskList', personalTasks, personalSortOrder);
    renderTaskList('schoolTaskList', schoolTasks, schoolSortOrder);
  }

  document.getElementById('addTaskBtn').addEventListener('click', function() {
    const taskInput = document.getElementById('taskInput');
    const taskType = document.getElementById('taskType').value;
    const text = taskInput.value.trim();
    if (!text) return;
    if (taskType === 'personal') {
      personalTasks.push({ text });
    } else {
      schoolTasks.push({ text });
    }
    taskInput.value = '';
    renderTasks();
  });

  document.getElementById('personalSort').addEventListener('change', function(e) {
    personalSortOrder = e.target.value;
    renderTasks();
  });

  document.getElementById('schoolSort').addEventListener('change', function(e) {
    schoolSortOrder = e.target.value;
    renderTasks();
  });

  // Initial render
  renderTasks();
});

// Initial render
renderTasks();
});
