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
          if (response && response.success) showCustomPopup('Event added to Outlook Calendar!');
          else showCustomPopup('Failed to add event to Outlook.', 'error');
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
          // Sync deadlines to chrome.storage.local for background.js
          const deadlines = JSON.parse(localStorage.getItem('deadlines') || '[]');
          chrome.storage.local.set({ deadlines });
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
          div.style.transition = 'box-shadow 0.2s, transform 0.2s';
          div.style.boxShadow = '0 0 0 rgba(45,108,223,0)';
          div.onmouseenter = () => {
            div.style.boxShadow = '0 2px 12px rgba(45,108,223,0.10)';
            div.style.transform = 'scale(1.03)';
          };
          div.onmouseleave = () => {
            div.style.boxShadow = '0 0 0 rgba(45,108,223,0)';
            div.style.transform = 'scale(1)';
          };
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
          delBtn.style.transition = 'transform 0.18s cubic-bezier(.4,2,.3,1)';
          delBtn.onmouseover = () => { delBtn.style.transform = 'scale(1.25) rotate(-10deg)'; };
          delBtn.onmouseout = () => { delBtn.style.transform = 'scale(1) rotate(0)'; };
          delBtn.onclick = () => {
            div.style.transition = 'transform 0.25s cubic-bezier(.4,2,.3,1), opacity 0.25s';
            div.style.transform = 'scale(0.7)';
            div.style.opacity = '0';
            setTimeout(() => {
              let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
              let idx = tasks.findIndex(t => (typeof t === 'string' ? t === obj.text : t.text === obj.text && (t.type || type) === (obj.type || type)));
              if (idx > -1) {
                tasks.splice(idx, 1);
                localStorage.setItem('tasks', JSON.stringify(tasks));
                loadTasks();
                showCustomPopup('Task deleted.');
              }
            }, 180);
          };
          div.appendChild(delBtn);
          if (list) {
            div.style.opacity = '0';
            div.style.transform = 'scale(0.7)';
            list.appendChild(div);
            setTimeout(() => {
              div.style.opacity = '1';
              div.style.transform = 'scale(1)';
            }, 10);
          }
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
  loadDeadlines();

  // --- Reminder toggle logic ---
  const reminderToggle = document.getElementById('reminderToggle');
  // --- Show reminder popup on new tab if enabled ---
  function showDeadlineReminderIfNeeded() {
    if (!reminderToggle) return;
    chrome.storage.local.get(['reminderToggle'], (result) => {
      // Treat undefined/null as enabled (default ON)
      const remindersEnabled = (typeof result.reminderToggle === 'undefined' || result.reminderToggle === null) ? true : !!result.reminderToggle;
      if (!remindersEnabled) {
        return;
      }
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
        // Only show on actual browser tabs (not extension popup or new tab)
        const isRealTab = (
          window.location.protocol === 'http:' ||
          window.location.protocol === 'https:' ||
          window.location.protocol === 'file:'
        );
        if (isRealTab) {
          // Show custom popup as before
          showCustomPopup(
            `Upcoming deadline: ${escapeHtml(closest.text)} (${new Date(closest.date).toLocaleString()})`,
            'info'
          );
          // Also show system notification if supported
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('Upcoming deadline', {
              body: `${closest.text} (${new Date(closest.date).toLocaleString()})`,
              icon: 'icon.png'
            });
          } else if (window.Notification && Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                new Notification('Upcoming deadline', {
                  body: `${closest.text} (${new Date(closest.date).toLocaleString()})`,
                  icon: 'icon.png'
                });
              }
            });
          }
        }
      }
    });
  }

  // Outlook Calendar integration does not require manual Client ID entry in popup

  if (reminderToggle && chrome.storage && chrome.storage.local) {
    // Always sync toggle state from chrome.storage.local on load
    chrome.storage.local.get(['reminderToggle'], (result) => {
      if (typeof result.reminderToggle === 'undefined' || result.reminderToggle === null) {
        reminderToggle.checked = true;
        chrome.storage.local.set({ reminderToggle: true });
      } else {
        reminderToggle.checked = !!result.reminderToggle;
      }
    });
    // Listen for changes in chrome.storage.local from other extension contexts
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.reminderToggle && reminderToggle) {
        if (typeof changes.reminderToggle.newValue === 'undefined' || changes.reminderToggle.newValue === null) {
          reminderToggle.checked = true;
          chrome.storage.local.set({ reminderToggle: true });
        } else {
          reminderToggle.checked = !!changes.reminderToggle.newValue;
        }
      }
    });
    reminderToggle.addEventListener('change', () => {
      chrome.storage.local.set({ reminderToggle: reminderToggle.checked });
    });
  }

  // Call after toggle and deadlines loaded
  setTimeout(showDeadlineReminderIfNeeded, 200);
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
    popup.style.bottom = '24px';
    popup.style.right = '24px';
    popup.style.left = 'auto';
    popup.style.top = 'auto';
    popup.style.transform = 'translateY(30px) scale(0.95)';
    popup.style.opacity = '0';
    popup.style.zIndex = 2147483647; // highest z-index to ensure visibility
    popup.style.background = type === 'error'
      ? 'linear-gradient(90deg, #e74c3c 60%, #ff7675 100%)'
      : 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
    popup.style.color = '#fff';
    popup.style.padding = '8px 14px';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 4px 16px rgba(45,108,223,0.13)';
    popup.style.fontSize = '15px';
    popup.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    popup.style.fontWeight = '500';
    popup.style.maxWidth = '200px';
    popup.style.pointerEvents = 'auto';
    popup.style.transition = 'opacity 0.3s, transform 0.4s cubic-bezier(.4,2,.3,1)';
    popup.style.display = 'flex';
    popup.style.alignItems = 'center';
    popup.style.gap = '10px';

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
    closeBtn.onmouseenter = () => closeBtn.style.transform = 'scale(1.3) rotate(10deg)';
    closeBtn.onmouseleave = () => closeBtn.style.transform = 'scale(1) rotate(0)';
    closeBtn.onclick = () => {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(30px) scale(0.95)';
      setTimeout(() => popup.remove(), 350);
    };

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
    // Animate in
    setTimeout(() => {
      popup.style.opacity = '1';
      popup.style.transform = 'translateY(0) scale(1)';
    }, 10);
    // Animate out
    setTimeout(() => {
      popup.style.opacity = '0';
      popup.style.transform = 'translateY(30px) scale(0.95)';
      setTimeout(() => popup.remove(), 400);
    }, 4000);
  } catch (e) {
    // fallback if popup fails
    alert(message);
  }
}

