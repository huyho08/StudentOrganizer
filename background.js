// Outlook Calendar (Microsoft Graph API) integration
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'createEvent') {
    // 1. Get Microsoft access token using chrome.identity.launchWebAuthFlow
    const clientId = 'YOUR_AZURE_APP_CLIENT_ID'; // Replace with your Azure app's client ID
    const redirectUri = chrome.identity.getRedirectURL('oauth2');
    const scopes = 'openid profile offline_access Calendars.ReadWrite';
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;

    chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    }, async (redirectResponse) => {
      if (chrome.runtime.lastError || !redirectResponse) {
        sendResponse({ success: false, error: 'Auth failed' });
        return;
      }
      // Extract access token from redirectResponse
      const m = redirectResponse.match(/[#&]access_token=([^&]*)/);
      if (!m) {
        sendResponse({ success: false, error: 'No access token' });
        return;
      }
      const accessToken = m[1];

      // 2. Create event in Outlook Calendar using Microsoft Graph API
      const event = {
        subject: message.title,
        start: {
          dateTime: new Date(message.dateTime).toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(new Date(message.dateTime).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'UTC'
        }
      };

      fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      })
      .then(response => response.json())
      .then(data => {
        if (data.id) sendResponse({ success: true, data });
        else sendResponse({ success: false, error: data });
      })
      .catch(error => {
        console.error(error);
        sendResponse({ success: false, error });
      });
    });
    return true;
  }
});

// Show custom popup on every website load (not just new tab)
chrome.webNavigation.onCompleted.addListener((details) => {
  // Only inject into main frame, not iframes
  if (details.frameId !== 0) return;
  chrome.storage.local.get(['deadlines', 'reminderToggle'], (result) => {
    const deadlines = result.deadlines || [];
    // Check if reminders are enabled (default to true if undefined)
    const remindersEnabled = result.reminderToggle !== false;
    if (!remindersEnabled || !deadlines.length) return;
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
    if (closest && details.tabId) {
      chrome.scripting.executeScript({
        target: { tabId: details.tabId },
        world: "MAIN",
        func: (text, dateStr) => {
          // Remove existing popup if present
          let old = document.getElementById('student-organizer-reminder');
          if (old) old.remove();
          // Create popup at bottom right of the whole screen
          const popup = document.createElement('div');
          popup.id = 'student-organizer-reminder';
          popup.style.position = 'fixed';
          popup.style.bottom = '30px';
          popup.style.right = '30px';
          popup.style.left = 'auto';
          popup.style.top = 'auto';
          popup.style.transform = 'none';
          popup.style.zIndex = 2147483647;
          popup.style.background = 'linear-gradient(90deg, #2d6cdf 60%, #5eaefd 100%)';
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
          closeBtn.innerHTML = '\u00D7';
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
          icon.innerHTML = '&#9432;';
          icon.style.fontSize = '20px';

          // Message
          const msg = document.createElement('span');
          msg.textContent = `${text} (${dateStr})`;

          popup.appendChild(icon);
          popup.appendChild(msg);
          popup.appendChild(closeBtn);

          document.body.appendChild(popup);

          setTimeout(() => {
            popup.style.opacity = '0.0';
            setTimeout(() => popup.remove(), 400);
          }, 6000);
        },
        args: [
          `Upcoming deadline: ${closest.text}`,
          new Date(closest.date).toLocaleString()
        ]
      });
    }
  });
}, { url: [{ schemes: ['http', 'https'] }] });
