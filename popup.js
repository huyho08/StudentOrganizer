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
    deadlines.forEach((deadline, idx) => {
      const div = document.createElement('div');
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.justifyContent = 'space-between';
      div.textContent = `${deadline.text} (${new Date(deadline.date).toLocaleString()})`;
      // Remove button
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#e74c3c"/><line x1="4.5" y1="4.5" x2="9.5" y2="9.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/><line x1="9.5" y1="4.5" x2="4.5" y2="9.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/></svg>';
      delBtn.style.background = 'transparent';
      delBtn.style.border = 'none';
      delBtn.style.padding = '0 2px';
      delBtn.style.marginLeft = '8px';
      delBtn.style.cursor = 'pointer';
      delBtn.style.display = 'flex';
      delBtn.style.alignItems = 'center';
      delBtn.style.transition = 'transform 0.18s cubic-bezier(.4,2,.3,1)';
      delBtn.style.width = '22px';
      delBtn.style.height = '22px';
      delBtn.onmouseover = () => { delBtn.style.transform = 'scale(1.2)'; };
      delBtn.onmouseout = () => { delBtn.style.transform = 'scale(1)'; };
      delBtn.onclick = () => {
        div.style.transform = 'scale(0.7)';
        div.style.opacity = '0';
        setTimeout(() => {
          let deadlinesArr = JSON.parse(localStorage.getItem('deadlines') || '[]');
          deadlinesArr.splice(idx, 1);
          localStorage.setItem('deadlines', JSON.stringify(deadlinesArr));
          // Sync to chrome.storage.local for background.js
          chrome.storage.local.set({ deadlines: deadlinesArr });
          loadDeadlines();
        }, 180);
      };
      div.appendChild(delBtn);
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
  const personalTaskList = document.getElementById('personalTaskList');
  const schoolTaskList = document.getElementById('schoolTaskList');
  // Removed manual sorting dropdowns; sorting will be automatic using keywords.json

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
      // Load keywords.json for sorting
      fetch('keywords.json')
        .then(res => res.json())
        .then(keywordsData => {
          const personalKeywords = Array.isArray(keywordsData.personal) ? keywordsData.personal.map(k => k.toLowerCase()) : [];
          const schoolKeywords = Array.isArray(keywordsData.school) ? keywordsData.school.map(k => k.toLowerCase()) : [];
          // Assign tasks to personal or school based on keywords
          let unknownTasks = [];
          tasks.forEach((t, idx) => {
            const text = (typeof t === 'string' ? t : t.text || '').toLowerCase();
            if (t.type === 'personal' || (!t.type && personalKeywords.some(k => text.includes(k)))) {
              personal.push(t);
            } else if (t.type === 'school' || (!t.type && schoolKeywords.some(k => text.includes(k)))) {
              school.push(t);
            } else {
              unknownTasks.push({ t, idx });
        .then(res => res.json())
        .then(keywordsData => {
          const personalKeywords = Array.isArray(keywordsData.personal) ? keywordsData.personal.map(k => k.toLowerCase()) : [];
          const schoolKeywords = Array.isArray(keywordsData.school) ? keywordsData.school.map(k => k.toLowerCase()) : [];
          const lowerText = text.toLowerCase();
          // Find all matching keywords in both categories
          const matchedPersonal = personalKeywords.filter(k => lowerText.includes(k));
          const matchedSchool = schoolKeywords.filter(k => lowerText.includes(k));
          let type = null;
          if (matchedPersonal.length && matchedSchool.length) {
            // Conflict: prompt user for category
            let modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.18)';
            modal.style.zIndex = 2147483648;
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            let box = document.createElement('div');
            box.style.background = '#fff';
            box.style.borderRadius = '10px';
            box.style.boxShadow = '0 4px 24px rgba(45,108,223,0.13)';
            box.style.padding = '28px 32px 22px 32px';
            box.style.display = 'flex';
            box.style.flexDirection = 'column';
            box.style.alignItems = 'center';
            box.style.gap = '18px';
            let msg = document.createElement('div');
            msg.innerHTML = `This task matches keywords in <b>both Personal and School</b>.<br>Which category should it belong to?`;
            msg.style.fontSize = '16px';
            msg.style.color = '#e67e22';
            msg.style.fontWeight = '600';
            let taskSpan = document.createElement('div');
            taskSpan.textContent = `"${text}"`;
            taskSpan.style.fontSize = '15px';
            taskSpan.style.color = '#444';
            taskSpan.style.marginBottom = '8px';
            let btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '18px';
            let personalBtn = document.createElement('button');
            personalBtn.textContent = 'Personal';
            personalBtn.style.background = 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
            personalBtn.style.color = '#fff';
            personalBtn.style.border = 'none';
            personalBtn.style.borderRadius = '7px';
            personalBtn.style.fontSize = '15px';
            personalBtn.style.fontWeight = '600';
            personalBtn.style.padding = '8px 22px';
            personalBtn.style.cursor = 'pointer';
            let schoolBtn = document.createElement('button');
            schoolBtn.textContent = 'School';
            schoolBtn.style.background = 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
            schoolBtn.style.color = '#fff';
            schoolBtn.style.border = 'none';
            schoolBtn.style.borderRadius = '7px';
            schoolBtn.style.fontSize = '15px';
            schoolBtn.style.fontWeight = '600';
            schoolBtn.style.padding = '8px 22px';
            schoolBtn.style.cursor = 'pointer';
            let neitherBtn = document.createElement('button');
            neitherBtn.textContent = 'Neither';
            neitherBtn.style.background = '#eaeaea';
            neitherBtn.style.color = '#444';
            neitherBtn.style.border = 'none';
            neitherBtn.style.borderRadius = '7px';
            neitherBtn.style.fontSize = '15px';
            neitherBtn.style.fontWeight = '600';
            neitherBtn.style.padding = '8px 22px';
            neitherBtn.style.cursor = 'pointer';
            function updateKeywordsFile(keyword, category) {
              fetch('keywords.json')
                .then(res => res.json())
                .then(data => {
                  if (!data[category]) data[category] = [];
                  if (!data[category].includes(keyword)) {
                    data[category].push(keyword);
                    fetch('keywords.json', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    });
                  }
                });
            }
            personalBtn.onclick = () => {
              tasks.push({ text, type: 'personal' });
              localStorage.setItem('tasks', JSON.stringify(tasks));
              updateKeywordsFile(text.toLowerCase(), 'personal');
              document.body.removeChild(modal);
              taskInput.value = '';
              setTimeout(() => {
                loadTasks();
                showCustomPopup('Task added!');
              }, 200);
            };
            schoolBtn.onclick = () => {
              tasks.push({ text, type: 'school' });
              localStorage.setItem('tasks', JSON.stringify(tasks));
              updateKeywordsFile(text.toLowerCase(), 'school');
              document.body.removeChild(modal);
              taskInput.value = '';
              setTimeout(() => {
                loadTasks();
                showCustomPopup('Task added!');
              }, 200);
            };
            neitherBtn.onclick = () => {
              document.body.removeChild(modal);
              taskInput.value = '';
              showCustomPopup('Task not categorized.');
            };
            btnRow.appendChild(personalBtn);
            btnRow.appendChild(schoolBtn);
            btnRow.appendChild(neitherBtn);
            box.appendChild(msg);
            box.appendChild(taskSpan);
            box.appendChild(btnRow);
            modal.appendChild(box);
            document.body.appendChild(modal);
            return;
          } else if (matchedPersonal.length) {
            type = 'personal';
          } else if (matchedSchool.length) {
            type = 'school';
          }
          if (type) {
            tasks.push({ text, type });
            localStorage.setItem('tasks', JSON.stringify(tasks));
            taskInput.value = '';
            loadTasks();
            showCustomPopup('Task added!');
          } else {
            // Prompt user for category if unknown
            let modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.18)';
            modal.style.zIndex = 2147483648;
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            let box = document.createElement('div');
            box.style.background = '#fff';
            box.style.borderRadius = '10px';
            box.style.boxShadow = '0 4px 24px rgba(45,108,223,0.13)';
            box.style.padding = '28px 32px 22px 32px';
            box.style.display = 'flex';
            box.style.flexDirection = 'column';
            box.style.alignItems = 'center';
            box.style.gap = '18px';
            let msg = document.createElement('div');
            msg.textContent = `Which category should this task belong to?`;
            msg.style.fontSize = '16px';
            msg.style.color = '#2d6cdf';
            msg.style.fontWeight = '600';
            let taskSpan = document.createElement('div');
            taskSpan.textContent = `"${text}"`;
            taskSpan.style.fontSize = '15px';
            taskSpan.style.color = '#444';
            taskSpan.style.marginBottom = '8px';
            let btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '18px';
            let personalBtn = document.createElement('button');
            personalBtn.textContent = 'Personal';
            personalBtn.style.background = 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
            personalBtn.style.color = '#fff';
            personalBtn.style.border = 'none';
            personalBtn.style.borderRadius = '7px';
            personalBtn.style.fontSize = '15px';
            personalBtn.style.fontWeight = '600';
            personalBtn.style.padding = '8px 22px';
            personalBtn.style.cursor = 'pointer';
            let schoolBtn = document.createElement('button');
            schoolBtn.textContent = 'School';
            schoolBtn.style.background = 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
            schoolBtn.style.color = '#fff';
            schoolBtn.style.border = 'none';
            schoolBtn.style.borderRadius = '7px';
            schoolBtn.style.fontSize = '15px';
            schoolBtn.style.fontWeight = '600';
            schoolBtn.style.padding = '8px 22px';
            schoolBtn.style.cursor = 'pointer';
            let neitherBtn = document.createElement('button');
            neitherBtn.textContent = 'Neither';
            neitherBtn.style.background = '#eaeaea';
            neitherBtn.style.color = '#444';
            neitherBtn.style.border = 'none';
            neitherBtn.style.borderRadius = '7px';
            neitherBtn.style.fontSize = '15px';
            neitherBtn.style.fontWeight = '600';
            neitherBtn.style.padding = '8px 22px';
            neitherBtn.style.cursor = 'pointer';
            function updateKeywordsFile(keyword, category) {
              fetch('keywords.json')
                .then(res => res.json())
                .then(data => {
                  if (!data[category]) data[category] = [];
                  if (!data[category].includes(keyword)) {
                    data[category].push(keyword);
                    fetch('keywords.json', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    });
                  }
                });
            }
            personalBtn.onclick = () => {
              tasks.push({ text, type: 'personal' });
              localStorage.setItem('tasks', JSON.stringify(tasks));
              updateKeywordsFile(text.toLowerCase(), 'personal');
              document.body.removeChild(modal);
              taskInput.value = '';
              setTimeout(() => {
                loadTasks();
                showCustomPopup('Task added!');
              }, 200);
            };
            schoolBtn.onclick = () => {
              tasks.push({ text, type: 'school' });
              localStorage.setItem('tasks', JSON.stringify(tasks));
              updateKeywordsFile(text.toLowerCase(), 'school');
              document.body.removeChild(modal);
              taskInput.value = '';
              setTimeout(() => {
                loadTasks();
                showCustomPopup('Task added!');
              }, 200);
            };
            neitherBtn.onclick = () => {
              document.body.removeChild(modal);
              taskInput.value = '';
              showCustomPopup('Task not categorized.');
            };
            btnRow.appendChild(personalBtn);
            btnRow.appendChild(schoolBtn);
            btnRow.appendChild(neitherBtn);
            box.appendChild(msg);
            box.appendChild(taskSpan);
            box.appendChild(btnRow);
            modal.appendChild(box);
            document.body.appendChild(modal);
            return;
          }
                div.style.opacity = '0';
                setTimeout(() => {
                  let tasksArr = JSON.parse(localStorage.getItem('tasks') || '[]');
                  tasksArr = tasksArr.filter(x => !(x.text === obj.text && (x.type || 'personal') === (obj.type || 'personal')));
                  localStorage.setItem('tasks', JSON.stringify(tasksArr));
                  loadTasks();
                }, 180);
              };
              div.appendChild(textSpan);
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
        })
        .catch(e => {
          if (personalTaskList) personalTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
          if (schoolTaskList) schoolTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
          showCustomPopup('Error loading tasks.', 'error');
        });

    // Helper to update keywords.json
    function updateKeywordsFile(keyword, category) {
      fetch('keywords.json')
        .then(res => res.json())
        .then(data => {
          if (!data[category]) data[category] = [];
          if (!data[category].includes(keyword)) data[category].push(keyword);
          // Save updated keywords.json
          fetch('keywords.json', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
        });
    }
    } catch (e) {
      if (personalTaskList) personalTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
      if (schoolTaskList) schoolTaskList.innerHTML = '<div style="color:red;">Error loading tasks.</div>';
      showCustomPopup('Error loading tasks.', 'error');
    }
  }

  if (addTaskBtn && taskInput) {
    addTaskBtn.addEventListener('click', () => {
      const text = taskInput.value.trim();
      if (!text) {
        showCustomPopup('Please enter a task.','error');
        return;
      }
      let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      if (tasks.some(t => (typeof t === 'string' ? t === text : t.text === text))) {
        showCustomPopup('Task already exists.','error');
        return;
      }
      // Try to auto-sort using keywords.json
      fetch('keywords.json')
        .then(res => res.json())
        .then(keywordsData => {
          const personalKeywords = Array.isArray(keywordsData.personal) ? keywordsData.personal.map(k => k.toLowerCase()) : [];
          const schoolKeywords = Array.isArray(keywordsData.school) ? keywordsData.school.map(k => k.toLowerCase()) : [];
          const lowerText = text.toLowerCase();
          let type = null;
          if (personalKeywords.some(k => lowerText.includes(k))) {
            type = 'personal';
          } else if (schoolKeywords.some(k => lowerText.includes(k))) {
            type = 'school';
          }
          if (type) {
            tasks.push({ text, type });
            localStorage.setItem('tasks', JSON.stringify(tasks));
            taskInput.value = '';
            loadTasks();
            showCustomPopup('Task added!');
          } else {
            // Prompt user for category if unknown
            let modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100vw';
            modal.style.height = '100vh';
            modal.style.background = 'rgba(0,0,0,0.18)';
            modal.style.zIndex = 2147483648;
            modal.style.display = 'flex';
            modal.style.alignItems = 'center';
            modal.style.justifyContent = 'center';
            let box = document.createElement('div');
            box.style.background = '#fff';
            box.style.borderRadius = '10px';
            box.style.boxShadow = '0 4px 24px rgba(45,108,223,0.13)';
            box.style.padding = '28px 32px 22px 32px';
            box.style.display = 'flex';
            box.style.flexDirection = 'column';
            box.style.alignItems = 'center';
            box.style.gap = '18px';
            let msg = document.createElement('div');
            msg.textContent = `Which category should this task belong to?`;
            msg.style.fontSize = '16px';
            msg.style.color = '#2d6cdf';
            msg.style.fontWeight = '600';
            let taskSpan = document.createElement('div');
            taskSpan.textContent = `"${text}"`;
            taskSpan.style.fontSize = '15px';
            taskSpan.style.color = '#444';
            taskSpan.style.marginBottom = '8px';
            let btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.gap = '18px';
            let personalBtn = document.createElement('button');
            personalBtn.textContent = 'Personal';
            personalBtn.style.background = 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
            personalBtn.style.color = '#fff';
            personalBtn.style.border = 'none';
            personalBtn.style.borderRadius = '7px';
            personalBtn.style.fontSize = '15px';
            personalBtn.style.fontWeight = '600';
            personalBtn.style.padding = '8px 22px';
            personalBtn.style.cursor = 'pointer';
            let schoolBtn = document.createElement('button');
            schoolBtn.textContent = 'School';
            schoolBtn.style.background = 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
            schoolBtn.style.color = '#fff';
            schoolBtn.style.border = 'none';
            schoolBtn.style.borderRadius = '7px';
            schoolBtn.style.fontSize = '15px';
            schoolBtn.style.fontWeight = '600';
            schoolBtn.style.padding = '8px 22px';
            schoolBtn.style.cursor = 'pointer';
            // Add Neither button
            let neitherBtn = document.createElement('button');
            neitherBtn.textContent = 'Neither';
            neitherBtn.style.background = '#eaeaea';
            neitherBtn.style.color = '#444';
            neitherBtn.style.border = 'none';
            neitherBtn.style.borderRadius = '7px';
            neitherBtn.style.fontSize = '15px';
            neitherBtn.style.fontWeight = '600';
            neitherBtn.style.padding = '8px 22px';
            neitherBtn.style.cursor = 'pointer';

            // Helper to update keywords.json
            function updateKeywordsFile(keyword, category) {
              fetch('keywords.json')
                .then(res => res.json())
                .then(data => {
                  if (!data[category]) data[category] = [];
                  if (!data[category].includes(keyword)) {
                    data[category].push(keyword);
                    // Save updated keywords.json (will only work in dev/local, not in production extension)
                    fetch('keywords.json', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data)
                    });
                  }
                });
            }

            personalBtn.onclick = () => {
              tasks.push({ text, type: 'personal' });
              localStorage.setItem('tasks', JSON.stringify(tasks));
              // Add the keyword to keywords.json (lowercase for consistency)
              updateKeywordsFile(text.toLowerCase(), 'personal');
              document.body.removeChild(modal);
              taskInput.value = '';
              // Wait a bit to ensure keywords.json is updated before reloading tasks
              setTimeout(() => {
                loadTasks();
                showCustomPopup('Task added!');
              }, 200);
            };
            schoolBtn.onclick = () => {
              tasks.push({ text, type: 'school' });
              localStorage.setItem('tasks', JSON.stringify(tasks));
              // Add the keyword to keywords.json (lowercase for consistency)
              updateKeywordsFile(text.toLowerCase(), 'school');
              document.body.removeChild(modal);
              taskInput.value = '';
              // Wait a bit to ensure keywords.json is updated before reloading tasks
              setTimeout(() => {
                loadTasks();
                showCustomPopup('Task added!');
              }, 200);
            };
            neitherBtn.onclick = () => {
              document.body.removeChild(modal);
              taskInput.value = '';
              showCustomPopup('Task not categorized.');
            };
            btnRow.appendChild(personalBtn);
            btnRow.appendChild(schoolBtn);
            btnRow.appendChild(neitherBtn);
            box.appendChild(msg);
            box.appendChild(taskSpan);
            box.appendChild(btnRow);
            modal.appendChild(box);
            document.body.appendChild(modal);
          }
        });
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
