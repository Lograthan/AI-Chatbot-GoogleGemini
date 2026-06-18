import { CONFIG } from './config.js';

// ==========================================
// STATE MANAGEMENT
// ==========================================
let chatHistory = [];
let isGenerating = false;

// ==========================================
// DOM SELECTORS
// ==========================================
const appContainer = document.getElementById('app-container');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const btnClearChat = document.getElementById('btn-clear-chat');
const btnThemeToggle = document.getElementById('btn-theme-toggle');
const btnSettings = document.getElementById('btn-settings');
const chatEmptyState = document.getElementById('chat-empty-state');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// Settings Modal Selectors
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key-input');
const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
const btnCloseSettings = document.getElementById('btn-close-settings');
const btnCancelSettings = document.getElementById('btn-cancel-settings');
const btnSaveSettings = document.getElementById('btn-save-settings');

// Theme SVG Icons
const iconSun = btnThemeToggle.querySelector('.icon-sun');
const iconMoon = btnThemeToggle.querySelector('.icon-moon');

// Eye SVG Icons
const iconEye = btnToggleKeyVisibility.querySelector('.icon-eye');
const iconEyeOff = btnToggleKeyVisibility.querySelector('.icon-eye-off');

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initChatHistory();
  initEventListeners();
  checkApiKeyStatus();
});

// ==========================================
// KEYBOARD & MOBILE VIEWPORT ADJUSTMENTS
// ==========================================
// Reset app container height to match dynamic viewport (supports mobile keyboard opening)
const updateViewportHeight = () => {
  const vh = window.innerHeight;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};
window.addEventListener('resize', updateViewportHeight);
window.addEventListener('orientationchange', updateViewportHeight);
updateViewportHeight();

// ==========================================
// API KEY & SETTINGS CONTROLLER
// ==========================================
function getApiKey() {
  return localStorage.getItem('gemini_api_key') || CONFIG.GEMINI_API_KEY || '';
}

function checkApiKeyStatus() {
  const key = getApiKey();
  if (!key) {
    updateStatus(false, 'API Key Missing');
    appendSystemMessage('Warning: Gemini API Key is missing. Please configure it in Settings (top right gear icon) to start chatting.', 'error');
    // Open settings modal automatically to prompt user
    toggleModal(settingsModal, true);
  } else {
    updateStatus(true, 'Gemini 2.5 Flash Active');
  }
}

function updateStatus(active, text) {
  if (active) {
    statusDot.style.backgroundColor = '#10b981'; // green
    statusDot.classList.add('pulsing');
  } else {
    statusDot.style.backgroundColor = '#ef4444'; // red
    statusDot.classList.remove('pulsing');
  }
  statusText.textContent = text;
}

// Toggle Modal Helper
function toggleModal(modal, show) {
  if (show) {
    modal.classList.add('active');
    // Populate stored key if any
    apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
  } else {
    modal.classList.remove('active');
  }
}

// ==========================================
// THEME SWITCHER CONTROLLER
// ==========================================
function initTheme() {
  const savedTheme = localStorage.getItem('chat_theme') || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('chat_theme', theme);
  
  if (theme === 'dark') {
    iconSun.style.display = 'block';
    iconMoon.style.display = 'none';
  } else {
    iconSun.style.display = 'none';
    iconMoon.style.display = 'block';
  }
}

// ==========================================
// LOCAL STORAGE CHAT HISTORY CONTROLLER
// ==========================================
function initChatHistory() {
  const stored = localStorage.getItem('gemini_chat_history');
  if (stored) {
    try {
      chatHistory = JSON.parse(stored);
      if (chatHistory.length > 0) {
        chatEmptyState.classList.add('hidden');
        chatHistory.forEach(msg => {
          appendMessageToDOM(msg.sender, msg.text, msg.timestamp, false);
        });
        scrollToBottom();
      }
    } catch (e) {
      console.error('Failed to parse chat history:', e);
      chatHistory = [];
    }
  }
}

function saveHistory() {
  localStorage.setItem('gemini_chat_history', JSON.stringify(chatHistory));
}

function clearChatHistory() {
  if (confirm('Are you sure you want to clear your conversation history? This cannot be undone.')) {
    chatHistory = [];
    localStorage.removeItem('gemini_chat_history');
    
    // Clear elements from DOM except empty state
    const messages = chatMessages.querySelectorAll('.message-wrapper');
    messages.forEach(msg => msg.remove());
    
    // Show empty state
    chatEmptyState.classList.remove('hidden');
    
    // Re-verify API Key status to display warning if needed
    checkApiKeyStatus();
  }
}

// ==========================================
// UI CHAT CONTROLLER
// ==========================================
function appendMessageToDOM(sender, text, timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), animate = true) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${sender}`;
  if (!animate) {
    wrapper.style.animation = 'none';
  }
  
  // Custom Icon Selector
  let avatarIconHTML = '';
  if (sender === 'user') {
    avatarIconHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
  } else if (sender === 'bot') {
    avatarIconHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"/>
      </svg>
    `;
  }

  const avatarDiv = sender !== 'system' ? `<div class="avatar">${avatarIconHTML}</div>` : '';
  const parsedContent = sender === 'bot' ? parseMarkdown(text) : escapeHTML(text);

  wrapper.innerHTML = `
    ${avatarDiv}
    <div class="message-content-box">
      <div class="message-bubble">${parsedContent}</div>
      ${sender !== 'system' ? `<div class="message-meta">${timestamp}</div>` : ''}
    </div>
  `;

  // Attach copy listeners to code blocks inside the DOM node
  if (sender === 'bot') {
    const copyButtons = wrapper.querySelectorAll('.btn-copy');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', handleCopyCode);
    });
  }

  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function appendSystemMessage(text, type = 'info') {
  appendMessageToDOM('system', text);
  const systemMsg = chatMessages.querySelector('.message-wrapper.system:last-child');
  if (systemMsg) {
    systemMsg.classList.add(type);
  }
}

function showTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.className = 'message-wrapper bot typing-indicator-wrapper';
  wrapper.innerHTML = `
    <div class="avatar">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z"/>
      </svg>
    </div>
    <div class="message-content-box">
      <div class="message-bubble">
        <div class="typing-indicator" id="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    </div>
  `;
  chatMessages.appendChild(wrapper);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = chatMessages.querySelector('.typing-indicator-wrapper');
  if (indicator) {
    indicator.remove();
  }
}

function scrollToBottom() {
  chatMessages.scrollTo({
    top: chatMessages.scrollHeight,
    behavior: 'smooth'
  });
}

// ==========================================
// SECURE INPUT SANITIZATION & MARKDOWN PARSER
// ==========================================
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Custom light-weight & secure markdown parser.
 * Renders paragraphs, lists, bold, italics, inline code, and block code elements.
 * Generates copy buttons for pre-formatted blocks.
 */
function parseMarkdown(md) {
  if (!md) return '';
  
  // Array to collect blocks (code blocks vs text blocks)
  const blocks = [];
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  // 1. Extract code blocks first to keep them pristine and prevent XSS or markdown parsing inside code
  while ((match = codeBlockRegex.exec(md)) !== null) {
    // Add text block before code block
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: md.slice(lastIndex, match.index)
      });
    }
    // Add code block
    blocks.push({
      type: 'code',
      lang: match[1] || 'text',
      content: match[2]
    });
    lastIndex = codeBlockRegex.lastIndex;
  }
  
  // Add remaining text block
  if (lastIndex < md.length) {
    blocks.push({
      type: 'text',
      content: md.slice(lastIndex)
    });
  }
  
  // 2. Render each block type
  return blocks.map(block => {
    if (block.type === 'code') {
      const escapedCode = escapeHTML(block.content.trim());
      const lang = block.lang.toLowerCase() || 'code';
      
      return `
        <div class="code-container">
          <div class="code-header">
            <span class="code-lang">${lang}</span>
            <button class="btn-copy" data-code="${encodeURIComponent(block.content.trim())}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
          <pre><code>${escapedCode}</code></pre>
        </div>
      `;
    } else {
      // Process lines of text blocks
      const lines = block.content.split('\n');
      let htmlOutput = [];
      let inList = false;
      let listType = null; // 'ul' or 'ol'
      
      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        
        // Escape content HTML first
        let escapedLine = escapeHTML(line);
        
        // Check for Bullet Lists (* or -)
        const bulletMatch = line.match(/^(\s*)([*\-])\s+(.+)$/);
        // Check for Numbered Lists (1., 2.)
        const numMatch = line.match(/^(\s*)(\d+)\.\s+(.+)$/);
        
        if (bulletMatch) {
          const listContent = parseInlineStyles(bulletMatch[3]);
          if (!inList || listType !== 'ul') {
            if (inList) htmlOutput.push(`</${listType}>`);
            htmlOutput.push('<ul>');
            inList = true;
            listType = 'ul';
          }
          htmlOutput.push(`<li>${listContent}</li>`);
        } else if (numMatch) {
          const listContent = parseInlineStyles(numMatch[3]);
          if (!inList || listType !== 'ol') {
            if (inList) htmlOutput.push(`</${listType}>`);
            htmlOutput.push('<ol>');
            inList = true;
            listType = 'ol';
          }
          htmlOutput.push(`<li>${listContent}</li>`);
        } else {
          // Empty or standard text line
          if (inList) {
            htmlOutput.push(`</${listType}>`);
            inList = false;
            listType = null;
          }
          
          if (line.trim() === '') {
            continue; // Skip double paragraphs for empty lines
          }
          
          const parsedLine = parseInlineStyles(escapedLine);
          htmlOutput.push(`<p>${parsedLine}</p>`);
        }
      }
      
      // Close list tags if still open at the end
      if (inList) {
        htmlOutput.push(`</${listType}>`);
      }
      
      return htmlOutput.join('');
    }
  }).join('');
}

// Parse bold, italics, and inline code formatting inside strings
function parseInlineStyles(text) {
  return text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italics: *text* or _text_
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Inline code: `code`
    .replace(/`(.*?)`/g, '<code>$1</code>');
}

// Copy Code Button handler
async function handleCopyCode(e) {
  const btn = e.currentTarget;
  const rawCode = decodeURIComponent(btn.getAttribute('data-code'));
  
  try {
    await navigator.clipboard.writeText(rawCode);
    
    // UI Visual feedback
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Copied!
    `;
    
    setTimeout(() => {
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        Copy
      `;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
}

// ==========================================
// GEMINI API INTEGRATION & RETRY LOGIC
// ==========================================
async function callGeminiAPI(messageText) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Google Gemini API Key is missing. Click the Settings icon to configure it.');
  }

  // Format conversational history payload according to Gemini specification
  const contents = [];
  
  // Format history nodes: user turns must have role: 'user', AI turns must have role: 'model'
  chatHistory.forEach(msg => {
    if (msg.sender === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.text }]
      });
    } else if (msg.sender === 'bot') {
      contents.push({
        role: 'model',
        parts: [{ text: msg.text }]
      });
    }
  });

  // Append new user message
  contents.push({
    role: 'user',
    parts: [{ text: messageText }]
  });

  // Prepare full request body
  const requestBody = {
    contents: contents,
    generationConfig: CONFIG.GENERATION_CONFIG,
    safetySettings: CONFIG.SAFETY_SETTINGS,
    systemInstruction: CONFIG.SYSTEM_INSTRUCTION
  };

  const url = `${CONFIG.API_URL}?key=${apiKey}`;
  const { maxRetries, initialDelayMs, backoffFactor } = CONFIG.RETRY_CONFIG;

  // Implementation of request loop with exponential backoff for rate limits or server errors
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle transient errors that are eligible for retry
        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          const delay = initialDelayMs * Math.pow(backoffFactor, attempt);
          console.warn(`API call failed with status ${response.status}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
          updateStatus(false, `Retrying request (${attempt + 1}/${maxRetries})...`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Parse payload response
      const candidate = data.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        throw new Error('Response blocked by safety filters. Please refine your prompt.');
      }
      
      const responseText = candidate?.content?.parts?.[0]?.text;
      if (!responseText) {
        throw new Error('Received empty response from Gemini API.');
      }

      updateStatus(true, 'Gemini 2.5 Flash Active');
      return responseText;

    } catch (error) {
      if (attempt === maxRetries) {
        updateStatus(false, 'API Request Failed');
        throw error;
      }
    }
  }
}

// ==========================================
// CORE SEND MESSAGE CONTROLLER
// ==========================================
async function handleSendMessage(text) {
  if (!text || isGenerating) return;

  // Hide empty state
  chatEmptyState.classList.add('hidden');

  // Add User Message to History and DOM
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  appendMessageToDOM('user', text, timestamp);
  chatHistory.push({ sender: 'user', text, timestamp });
  saveHistory();

  // Reset input field and disabled state
  chatInput.value = '';
  chatInput.style.height = '24px'; // Reset height
  btnSend.disabled = true;

  // Toggle Loading/Typing State
  isGenerating = true;
  showTypingIndicator();

  try {
    const responseText = await callGeminiAPI(text);
    
    // Add AI Response to DOM and History
    removeTypingIndicator();
    const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    appendMessageToDOM('bot', responseText, botTimestamp);
    chatHistory.push({ sender: 'bot', text: responseText, timestamp: botTimestamp });
    saveHistory();
  } catch (error) {
    removeTypingIndicator();
    console.error('Gemini API Error:', error);
    appendSystemMessage(`Error: ${error.message || 'Something went wrong.'}`, 'error');
  } finally {
    isGenerating = false;
  }
}

// ==========================================
// EVENT LISTENERS BINDING
// ==========================================
function initEventListeners() {
  
  // Submit Form Handler
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) {
      handleSendMessage(text);
    }
  });

  // Enable/Disable Send button dynamically, auto-expand input heights
  chatInput.addEventListener('input', () => {
    const text = chatInput.value.trim();
    btnSend.disabled = !text || isGenerating;

    // Auto expand height logic
    chatInput.style.height = '24px'; // Reset
    chatInput.style.height = `${Math.min(chatInput.scrollHeight - 4, 120)}px`;
  });

  // Keypress handler: Enter sends, Shift+Enter new line
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (text && !isGenerating) {
        handleSendMessage(text);
      }
    }
  });

  // Theme Toggle Button click
  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(targetTheme);
  });

  // Settings Gear Button Click (Open Modal)
  btnSettings.addEventListener('click', () => {
    toggleModal(settingsModal, true);
  });

  // Close Settings Dialog Click (Modal X)
  btnCloseSettings.addEventListener('click', () => {
    toggleModal(settingsModal, false);
  });

  // Close Modal on Cancel Click
  btnCancelSettings.addEventListener('click', () => {
    toggleModal(settingsModal, false);
  });

  // Close modal when clicking outside contents
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      toggleModal(settingsModal, false);
    }
  });

  // Save Settings Modal Handler
  btnSaveSettings.addEventListener('click', () => {
    const newKey = apiKeyInput.value.trim();
    if (newKey) {
      localStorage.setItem('gemini_api_key', newKey);
      appendSystemMessage('Settings Saved: Your API key has been securely cached in Local Storage.', 'info');
    } else {
      localStorage.removeItem('gemini_api_key');
      appendSystemMessage('Settings Saved: Local Storage API key cleared.', 'info');
    }
    toggleModal(settingsModal, false);
    checkApiKeyStatus();
  });

  // Toggle API Key text visibility inside modal
  btnToggleKeyVisibility.addEventListener('click', () => {
    const currentType = apiKeyInput.type;
    if (currentType === 'password') {
      apiKeyInput.type = 'text';
      iconEye.style.display = 'block';
      iconEyeOff.style.display = 'none';
    } else {
      apiKeyInput.type = 'password';
      iconEye.style.display = 'none';
      iconEyeOff.style.display = 'block';
    }
  });

  // Click handler for Suggested Starter Prompt Cards
  const cards = chatEmptyState.querySelectorAll('.prompt-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const promptText = card.getAttribute('data-prompt');
      if (promptText && !isGenerating) {
        chatInput.value = promptText;
        chatInput.dispatchEvent(new Event('input')); // triggers height adjust and button enable
        chatInput.focus();
        
        // Auto send on click
        handleSendMessage(promptText);
      }
    });
  });

  // Clear Chat History Button Click
  btnClearChat.addEventListener('click', clearChatHistory);
}
