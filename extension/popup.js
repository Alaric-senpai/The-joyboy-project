/**
 * joyboy-extractor Popup UI Logic
 * Proper session and persistence handling with custom UI
 */

let currentAnalysis = null;
let currentSettings = {};

/**
 * Initialize popup
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('[joyboy-popup] Initializing...');
    setupEventListeners();
    loadSettings();
    loadHistory();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Analyze buttons
    document.getElementById('analyzeBtn').addEventListener('click', runAnalysis);
    document.getElementById('analyzeWithAIBtn').addEventListener('click', runAnalysisWithAI);

    // Results actions
    document.getElementById('viewDetailsBtn').addEventListener('click', viewFullAnalysis);
    document.getElementById('exportBtn').addEventListener('click', exportJSON);
    document.getElementById('newAnalysisBtn').addEventListener('click', resetAnalysis);

    // Settings
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSettingsHandler);

    // History
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('history-item')) {
            viewHistoryItem(parseInt(e.target.dataset.id));
        }
        if (e.target.classList.contains('delete-history-btn')) {
            e.stopPropagation();
            deleteHistoryItem(parseInt(e.target.dataset.id));
        }
    });

    // Clear all history
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL analyses? This cannot be undone.')) {
                chrome.runtime.sendMessage({ action: 'clearAllResults' }, (response) => {
                    if (response && response.success) {
                        console.log('[joyboy-popup] Cleared all history');
                        loadHistory();
                    }
                });
            }
        });
    }
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Refresh history when switching to history tab
    if (tabName === 'history') {
        loadHistory();
    }
}

/**
 * Run DOM analysis
 */
function runAnalysis() {
    showLoading(true);
    hideError();
    disableButtons(true);

    try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                showError('No active tab found');
                showLoading(false);
                disableButtons(false);
                return;
            }

            const tab = tabs[0];
            console.log('[joyboy-popup] Sending analyzeDom message to tab:', tab.id);

            chrome.tabs.sendMessage(
                tab.id,
                { action: 'analyzeDom' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[joyboy-popup] Runtime error:', chrome.runtime.lastError);
                        showError('Failed to analyze page. Make sure content script is injected. Try refreshing the page.');
                        showLoading(false);
                        disableButtons(false);
                        return;
                    }

                    if (response && response.success) {
                        console.log('[joyboy-popup] Analysis successful');
                        currentAnalysis = response.data;
                        displayResults(response.data);
                        showLoading(false);
                        disableButtons(false);
                    } else {
                        showError(response?.error || 'Analysis failed');
                        showLoading(false);
                        disableButtons(false);
                    }
                }
            );
        });
    } catch (error) {
        console.error('[joyboy-popup] Error:', error);
        showError(error.message);
        showLoading(false);
        disableButtons(false);
    }
}

/**
 * Run analysis with AI enhancement
 */
function runAnalysisWithAI() {
    // Check if AI is enabled and API key is set
    if (!currentSettings.enableAI) {
        showError('AI analysis is not enabled. Enable it in Settings and add your Moonshot API key.');
        return;
    }

    if (!currentSettings.moonShotApiKey) {
        showError('Moonshot API key is not configured. Add it in Settings.');
        return;
    }

    showLoading(true);
    hideError();
    disableButtons(true);

    try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) {
                showError('No active tab found');
                showLoading(false);
                disableButtons(false);
                return;
            }

            const tab = tabs[0];
            console.log('[joyboy-popup] Sending analyzeWithAI message to tab:', tab.id);

            chrome.tabs.sendMessage(
                tab.id,
                { action: 'analyzeWithAI' },
                (response) => {
                    if (chrome.runtime.lastError) {
                        console.error('[joyboy-popup] Runtime error:', chrome.runtime.lastError);
                        showError('Failed to analyze page. Try refreshing and try again.');
                        showLoading(false);
                        disableButtons(false);
                        return;
                    }

                    if (response && response.success) {
                        console.log('[joyboy-popup] AI Analysis successful');
                        currentAnalysis = response.data;
                        displayResults(response.data);

                        if (response.aiAnalysis) {
                            displayAIAnalysis(response.aiAnalysis);
                        }

                        showLoading(false);
                        disableButtons(false);
                    } else {
                        showError(response?.error || 'Analysis failed');
                        showLoading(false);
                        disableButtons(false);
                    }
                }
            );
        });
    } catch (error) {
        console.error('[joyboy-popup] Error:', error);
        showError(error.message);
        showLoading(false);
        disableButtons(false);
    }
}

/**
 * Display analysis results
 */
function displayResults(data) {
    document.getElementById('stat-elements').textContent = data.metadata.totalElements.toLocaleString();
    document.getElementById('stat-classes').textContent = data.metadata.uniqueClasses.toLocaleString();
    document.getElementById('stat-tags').textContent = data.metadata.uniqueTags.toLocaleString();

    document.getElementById('results').classList.remove('hidden');
}

/**
 * Display AI analysis results
 */
function displayAIAnalysis(aiAnalysis) {
    const aiResultsDiv = document.getElementById('aiResults');
    const aiContentDiv = document.getElementById('aiContent');

    aiContentDiv.textContent = aiAnalysis.analysis;
    aiResultsDiv.classList.remove('hidden');
}

/**
 * View full analysis in new window
 */
function viewFullAnalysis() {
    if (!currentAnalysis) return;

    const htmlContent = createResultsHTML(currentAnalysis);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    chrome.windows.create({
        url: url,
        type: 'popup',
        width: 1200,
        height: 800
    });
}

/**
 * Export analysis as JSON
 */
function exportJSON() {
    if (!currentAnalysis) return;

    try {
        const dataStr = JSON.stringify(currentAnalysis, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const filename = `joyboy-analysis-${Date.now()}.json`;

        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error('[joyboy-popup] Download failed:', chrome.runtime.lastError);
                showError('Failed to start download: ' + chrome.runtime.lastError.message);
            } else {
                console.log('[joyboy-popup] Download started with ID:', downloadId);
            }
            // Revoke object URL after delay
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    } catch (error) {
        console.error('[joyboy-popup] Export error:', error);
        showError('Failed to export JSON. Try again.');
    }
}

/**
 * Reset to initial state
 */
function resetAnalysis() {
    currentAnalysis = null;
    document.getElementById('results').classList.add('hidden');
    document.getElementById('aiResults').classList.add('hidden');
    document.getElementById('analyzeBtn').focus();
}

/**
 * Load settings from sync storage (persists across sessions)
 */
function loadSettings() {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
        if (response && response.success) {
            currentSettings = response.settings;
            console.log('[joyboy-popup] Settings loaded:', currentSettings);

            document.getElementById('apiKeyInput').value = currentSettings.moonShotApiKey || '';
            document.getElementById('enableAI').checked = currentSettings.enableAI || false;
            document.getElementById('themeSelect').value = currentSettings.theme || 'dark';

            // Apply theme
            applyTheme(currentSettings.theme || 'dark');
        } else {
            console.error('[joyboy-popup] Failed to load settings');
        }
    });
}

/**
 * Save settings handler
 */
function saveSettingsHandler() {
    const settings = {
        moonShotApiKey: document.getElementById('apiKeyInput').value.trim(),
        enableAI: document.getElementById('enableAI').checked,
        theme: document.getElementById('themeSelect').value
    };

    console.log('[joyboy-popup] Saving settings:', {
        moonShotApiKey: settings.moonShotApiKey ? '***' : '',
        enableAI: settings.enableAI,
        theme: settings.theme
    });

    chrome.runtime.sendMessage(
        { action: 'saveSettings', settings },
        (response) => {
            if (response && response.success) {
                currentSettings = settings;
                showSettingsMessage('✓ Settings saved successfully!');
                applyTheme(settings.theme);
                console.log('[joyboy-popup] Settings saved to sync storage');
            } else {
                showSettingsMessage('✗ Failed to save settings');
            }
        }
    );
}

/**
 * Apply theme
 */
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * Load history from local storage
 */
function loadHistory() {
    chrome.runtime.sendMessage({ action: 'getAnalysisResults' }, (response) => {
        if (!response || !response.success) {
            console.error('[joyboy-popup] Failed to load history');
            return;
        }

        const results = response.results || [];
        const historyList = document.getElementById('history-list');

        console.log('[joyboy-popup] Loaded history with', results.length, 'results');

        if (results.length === 0) {
            historyList.innerHTML = '<p class="empty-state">No analyses yet. Run an analysis to get started.</p>';
            return;
        }

        historyList.innerHTML = results.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-header">
                    <div class="history-title">${item.title || item.url}</div>
                    <button class="delete-history-btn" data-id="${item.id}" title="Delete">✕</button>
                </div>
                <div class="history-date">${new Date(item.timestamp).toLocaleString()}</div>
                <div class="history-summary">
                    <span>${item.summary.totalElements} elements</span>
                    <span>${item.summary.uniqueClasses} classes</span>
                    <span>${item.summary.uniqueTags} tags</span>
                </div>
            </div>
        `).join('');
    });
}

/**
 * View history item
 */
function viewHistoryItem(id) {
    chrome.runtime.sendMessage({ action: 'getAnalysisResults' }, (response) => {
        if (!response || !response.success) return;

        const results = response.results || [];
        const item = results.find(r => r.id === id);

        if (item) {
            console.log('[joyboy-popup] Loading history item:', id);
            currentAnalysis = item.data;
            displayResults(item.data);

            if (item.aiAnalysis) {
                displayAIAnalysis(item.aiAnalysis);
            }

            switchTab('analyze');
        }
    });
}

/**
 * Delete history item
 */
function deleteHistoryItem(id) {
    if (confirm('Are you sure you want to delete this analysis?')) {
        chrome.runtime.sendMessage({ action: 'deleteAnalysisResult', id }, (response) => {
            if (response && response.success) {
                console.log('[joyboy-popup] Deleted history item:', id);
                loadHistory();
            }
        });
    }
}

/**
 * UI Helper Functions
 */

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

function hideError() {
    document.getElementById('error').classList.add('hidden');
}

function showError(message) {
    const errorEl = document.getElementById('error');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function showSettingsMessage(message) {
    const msgEl = document.getElementById('settingsMessage');
    msgEl.textContent = message;
    msgEl.classList.remove('hidden');
    setTimeout(() => msgEl.classList.add('hidden'), 3000);
}

function disableButtons(disabled) {
    document.getElementById('analyzeBtn').disabled = disabled;
    document.getElementById('analyzeWithAIBtn').disabled = disabled;
}

/**
 * Generate HTML for full results view
 */
function createResultsHTML(data) {
    let previewBlocks = '';

    // Helper to format/indent HTML
    const formatHtml = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const formatNode = (node, level) => {
            const indent = '  '.repeat(level);
            if (node.nodeType === 3) { // Text
                const text = node.textContent.trim();
                return text ? `\n${indent}${text}` : '';
            }
            if (node.nodeType !== 1) return ''; // Elements only

            const tagName = node.tagName.toLowerCase();
            const attrs = Array.from(node.attributes)
                .map(a => `${a.name}="${a.value}"`)
                .join(' ');

            const startTag = `<${tagName}${attrs ? ' ' + attrs : ''}>`;
            const endTag = `</${tagName}>`;

            // Check if it has children
            if (node.childNodes.length === 0) return `\n${indent}${startTag}${endTag}`;

            // Check if it only has a single text child (keep on same line if short)
            if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3 && node.childNodes[0].textContent.length < 50) {
                return `\n${indent}${startTag}${node.childNodes[0].textContent.trim()}${endTag}`;
            }

            const children = Array.from(node.childNodes)
                .map(c => formatNode(c, level + 1))
                .join('');

            return `\n${indent}${startTag}${children}\n${indent}${endTag}`;
        };

        return formatNode(doc.body.firstElementChild, 0).trim();
    };

    // Syntax Highlighter - Tokenizer based
    const syntaxHighlight = (code) => {
        // Step 1: Escape the entire HTML first so it's safe to render
        let safeCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Step 2: Find Tags and process them safely
        // Regex matches: 1=prefix(&lt; or &lt;/), 2=tagName, 3=attributes part, 4=suffix(&gt; or /&gt;)
        return safeCode.replace(/(&lt;\/?)([a-zA-Z0-9-]+)((?:\s+[^&]*?)?)(\/?&gt;)/g, (match, prefix, tagName, attrs, suffix) => {

            // Step 3: Highlight Attributes INSIDE the tag only
            // We only look for patterns like: word="value" inside the 'attrs' string
            let coloredAttrs = attrs.replace(/([a-zA-Z0-9-]+)(=)(".*?")/g, (m, name, eq, val) => {
                return `<span class="tok-attr">${name}</span><span class="tok-punct">${eq}</span><span class="tok-val">${val}</span>`;
            });

            // Reassemble the tag with colors
            return `<span class="tok-punct">${prefix}</span><span class="tok-tag">${tagName}</span>${coloredAttrs}<span class="tok-punct">${suffix}</span>`;
        });
    };

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>joyboy Analysis Results</title>
  <style>
    :root {
      --bg-color: #1a1a2e;
      --bg-panel: #202033;
      --bg-hover: #2a2a40;
      --accent: #6d4aff;
      --accent-hover: #5835ea;
      --text-main: #ffffff;
      --text-muted: #aeb0b7;
      --border: #363645;
      
      /* Code Editor Theme (Aria Dark Inspired) */
      --code-bg: #11111a;
      --tok-tag: #ff79c6;      /* Pink */
      --tok-attr: #bd93f9;     /* Purple */
      --tok-val: #8be9fd;      /* Cyan */
      --tok-punct: #f8f8f2;    /* White/Grey */
      --tok-comment: #6272a4;  /* Grey Blue */
      
      /* Tree View Colors */
      --tree-line: #444;
      --attr-name: #ff79c6;
      --attr-val: #f1fa8c;
      --tag-name: #8be9fd;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--bg-color); color: var(--text-main); line-height: 1.6; height: 100vh; overflow: hidden; }
    
    /* Custom Scrollbar - Webkit */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: var(--bg-color); }
    ::-webkit-scrollbar-thumb { background: #444455; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #555566; }

    .container { max-width: 100%; height: 100%; display: flex; flex-direction: column; padding: 20px; }
    
    h1 { color: var(--accent); margin-bottom: 10px; font-size: 24px; font-weight: 700; }
    h2 { color: var(--text-muted); margin-top: 20px; margin-bottom: 15px; border-bottom: 2px solid var(--border); padding-bottom: 8px; font-weight: 600; font-size: 16px; }
    
    .metadata { background: var(--bg-panel); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid var(--border); font-size: 14px; }
    .metadata p { margin: 2px 0; color: var(--text-muted); }
    .metadata strong { color: var(--text-main); }
    
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0; }
    .stat { background: var(--bg-panel); padding: 15px; border-radius: 8px; text-align: center; border: 1px solid var(--border); transition: transform 0.2s; }
    .stat:hover { transform: translateY(-2px); border-color: var(--accent); }
    .stat .number { font-size: 22px; font-weight: bold; color: var(--accent); }
    .stat .label { display: block; color: var(--text-muted); font-size: 11px; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .tag { display: inline-block; background: var(--border); color: var(--text-main); padding: 2px 8px; margin: 2px; border-radius: 12px; font-size: 11px; font-family: monospace; border: 1px solid transparent; }
    
    table { width: 100%; border-collapse: separate; border-spacing: 0; background: var(--bg-panel); margin: 0; border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
    th { background: #161625; color: var(--text-main); padding: 12px 15px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; position: sticky; top: 0; font-weight: 600; }
    td { padding: 10px 15px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--bg-hover); color: var(--text-main); }
    code { background: var(--code-bg); color: var(--accent); padding: 2px 6px; border-radius: 4px; font-family: 'Fira Code', monospace; font-size: 12px; }
    
    /* CSS Tabs Styles */
    .tabs-container { flex: 1; display: flex; flex-direction: column; min-height: 0; }
    .tabs-nav { display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 15px; flex-shrink: 0; }
    input[name="tab-group"] { display: none; }
    
    .tab-label {
        background: transparent; border: none; color: var(--text-muted); padding: 8px 16px; font-size: 14px; cursor: pointer; border-radius: 6px; transition: all 0.2s; font-weight: 500; user-select: none;
    }
    .tab-label:hover { background: var(--bg-hover); color: var(--text-main); }
    
    #tab-overview:checked ~ .tabs-nav label[for="tab-overview"],
    #tab-datalog:checked ~ .tabs-nav label[for="tab-datalog"] {
        background: var(--accent); color: #fff; box-shadow: 0 2px 8px rgba(109, 74, 255, 0.3);
    }
    
    .tab-content { display: none; flex: 1; min-height: 0; overflow-y: auto; }
    
    #tab-overview:checked ~ #content-overview,
    #tab-datalog:checked ~ #content-datalog { display: block; }
    
    /* Split View Styles */
    #content-datalog { display: none; }
    #tab-datalog:checked ~ #content-datalog { display: flex; flex-direction: row; gap: 20px; overflow: hidden; }
    
    .list-column { flex: 1; overflow-y: auto; padding-right: 5px; }
    .preview-column { flex: 1; border-left: 1px solid var(--border); padding-left: 20px; overflow-y: auto; position: relative; background: var(--bg-panel); border-radius: 0 8px 8px 0; }
    
    .class-row-link { display: block; text-decoration: none; color: inherit; width: 100%; transition: background 0.1s; border-radius: 4px; }
    .class-row-link:hover { background: var(--bg-hover); }
    
    /* Preview Pane Logic */
    .preview-placeholder {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        color: var(--text-muted); font-style: italic;
        z-index: 1; pointer-events: none;
        flex-direction: column;
        gap: 10px;
    }
    .preview-placeholder i { font-size: 2rem; opacity: 0.5; }
    
    .detail-block {
        display: none;
        padding: 20px;
        position: absolute; top: 0; left: 0; width: 100%; min-height: 100%;
        background: var(--bg-panel);
        z-index: 2;
    }
    .detail-block:target { display: block; animation: slideIn 0.2s ease-out; }
    
    @keyframes slideIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }

    .sample-box { margin-bottom: 25px; background: var(--code-bg); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
    
    .sample-header { 
        padding: 10px 15px; background: #1a1a25; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--text-muted); 
        display: flex; justify-content: space-between; align-items: center;
    }

    /* Syntax Highlighting Colors */
    .tok-tag { color: var(--tok-tag); font-weight: bold; }
    .tok-attr { color: var(--tok-attr); font-style: italic; }
    .tok-val { color: var(--tok-val); }
    .tok-punct { color: var(--tok-punct); }
    
    /* HIERARCHY VIEW STYLES */
    .hierarchy-view {
        padding: 15px;
        font-family: 'Fira Code', monospace;
        font-size: 13px;
        overflow-x: auto;
    }
    .tree-node { 
        margin-left: 18px; 
        position: relative; 
        line-height: 1.8;
    }
    .tree-node::before { 
        content: ''; 
        position: absolute; 
        left: -12px; 
        top: 0; 
        bottom: 0; 
        width: 1px; 
        background: var(--tree-line);
    }
    .tree-node::after {
        content: '';
        position: absolute;
        left: -12px;
        top: 10px; /* approximately mid-height of the first line */
        width: 10px;
        height: 1px;
        background: var(--tree-line);
    }
    /* Hide vertical line for last child? Bit complex with recursion, simplifying visual */
    
    .node-tag { color: var(--tag-name); font-weight: bold; }
    .node-attrs-inline { color: #888; font-size: 11px; margin-left: 8px; }
    .attr-key { color: var(--attr-name); }
    .attr-val { color: var(--attr-val); }
    
    .code-view {
        padding: 15px;
        background: var(--code-bg);
        border-top: 1px solid var(--border);
        color: #f8f8f2;
        font-size: 12px;
        font-family: 'Fira Code', monospace;
        white-space: pre; /* Use pre to respect indentation from formatter */
        max-height: 300px;
        overflow: auto;
        tab-size: 2;
    }

  </style>
</head>
<body>
  <div class="container">
    <h1>joyboy Analysis Results</h1>
    
    <div class="metadata">
      <p><strong>URL:</strong> ${data.metadata.url}</p>
      <p><strong>Title:</strong> ${data.metadata.title}</p>
      <p><strong>Analyzed:</strong> ${new Date(data.metadata.timestamp).toLocaleString()}</p>
    </div>

    <!-- CSS Tabs Structure -->
    <div class="tabs-container">
        <input type="radio" name="tab-group" id="tab-overview" checked>
        <input type="radio" name="tab-group" id="tab-datalog">

        <div class="tabs-nav">
            <label for="tab-overview" class="tab-label">Overview</label>
            <label for="tab-datalog" class="tab-label">Data Log</label>
        </div>

        <!-- OVERVIEW TAB -->
        <div id="content-overview" class="tab-content">
            <div class="stats">
            <div class="stat">
                <div class="number">${data.metadata.totalElements}</div>
                <div class="label">Total Elements</div>
            </div>
            <div class="stat">
                <div class="number">${data.metadata.uniqueClasses}</div>
                <div class="label">Unique Classes</div>
            </div>
            <div class="stat">
                <div class="number">${data.metadata.uniqueTags}</div>
                <div class="label">Unique Tags</div>
            </div>
            </div>

            <h2>Top Classes by Frequency</h2>
            <table>
            <thead>
                <tr>
                <th>Class Name</th>
                <th>Usage Count</th>
                <th>Tags Used On</th>
                <th>Classification</th>
                </tr>
            </thead>
            <tbody>
                ${data.frequency.slice(0, 20).map(cls => {
        const classData = data.classes[cls.name];
        const tags = Object.keys(classData.tags).slice(0, 5).map(t => `<span class="tag">${t}</span>`).join(' ');
        return `
                    <tr>
                    <td><code class="class-name">${cls.name}</code></td>
                    <td>${cls.count}</td>
                    <td>${tags}</td>
                    <td>${classData.classification || 'custom'}</td>
                    </tr>
                `;
    }).join('')}
            </tbody>
            </table>

            <h2>Top HTML Tags</h2>
            <table>
            <thead>
                <tr>
                <th>Tag Name</th>
                <th>Count</th>
                <th>Percentage</th>
            </tr>
            </thead>
            <tbody>
                ${data.tagFrequency.slice(0, 20).map(tag => {
        const percentage = ((tag.count / data.metadata.totalElements) * 100).toFixed(1);
        return `
                    <tr>
                    <td><code>&lt;${tag.name}&gt;</code></td>
                    <td>${tag.count}</td>
                    <td>${percentage}%</td>
                    </tr>
                `;
    }).join('')}
            </tbody>
            </table>

            <h2>Common Class Combinations</h2>
            <table>
            <thead>
                <tr>
                <th>Classes</th>
                <th>Frequency</th>
                </tr>
            </thead>
            <tbody>
                ${data.patterns.map(pattern => `
                <tr>
                    <td>${pattern.classes.map(c => `<code>${c}</code>`).join(' + ')}</td>
                    <td>${pattern.frequency}</td>
                </tr>
                `).join('')}
            </tbody>
            </table>
        </div>

        <!-- DATA LOG TAB (Split View) -->
        <div id="content-datalog" class="tab-content">
            <div class="list-column">
                <h2>All Classes (Select to Preview)</h2>
                <table>
                <thead>
                    <tr>
                    <th>Class Name</th>
                    <th>Count</th>
                    <th>Tags</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.frequency.map((cls, index) => {
        const classData = data.classes[cls.name];
        const tags = Object.keys(classData.tags).map(t => `<span class="tag">${t}</span>`).join(' ');
        const detailId = `detail-${index}`;

        // Generate samples
        let samplesHtml = '';
        if (classData.samples && classData.samples.length > 0) {
            samplesHtml = classData.samples.map(s => {
                // Parse the HTML string to build a real structure tree
                const parser = new DOMParser();
                const doc = parser.parseFromString(s.html, 'text/html');
                const rootEl = doc.body.firstElementChild;

                // Recursive helper to build tree HTML
                const buildTree = (node, depth = 0) => {
                    if (!node || node.nodeType !== 1) return ''; // Elements only
                    if (depth > 3) return `<div class="tree-node" style="color:#555">... (nested depth limit)</div>`;

                    const tagName = node.tagName.toLowerCase();
                    const classes = node.classList.length ? '.' + Array.from(node.classList).join('.') : '';
                    const importantAttrs = Array.from(node.attributes)
                        .filter(a => a.name !== 'class' && a.name !== 'style') // Filter noisy attributes
                        .map(a => `<span class="attr-key">${a.name}</span>=<span class="attr-val">"${a.value}"</span>`)
                        .join(' ');

                    const childrenHtml = Array.from(node.children).map(child => buildTree(child, depth + 1)).join('');

                    return `
                                    <div class="tree-node">
                                        <div>
                                            <span class="node-tag">${tagName}${classes}</span>
                                            ${importantAttrs ? `<span class="node-attrs-inline">[ ${importantAttrs} ]</span>` : ''}
                                        </div>
                                        ${childrenHtml}
                                    </div>
                                `;
                };

                const hierarchyHtml = rootEl ? buildTree(rootEl) : '<div class="error">Could not parse structure</div>';

                // Format and Highlight Code
                const formattedCode = formatHtml(s.html);
                const highlightedCode = syntaxHighlight(formattedCode);

                return `
                            <div class="sample-box">
                                <div class="sample-header">
                                    <span>Hierarchy & Structure</span>
                                </div>
                                
                                <div class="hierarchy-view">
                                    <div style="margin-bottom:10px; opacity:0.6; font-size:11px;">Context: &lt;${s.parentTag || 'root'}&gt; > ...</div>
                                    ${hierarchyHtml}
                                </div>

                                <div class="sample-header" style="border-top:1px solid var(--border); margin-top:0;">
                                    <span>Raw Source</span>
                                </div>
                                <div class="code-view">${highlightedCode}</div>
                            </div>
                        `}).join('');
        } else {
            samplesHtml = '<div style="padding:20px; text-align:center; color:var(--text-muted)">No samples available</div>';
        }

        previewBlocks += `
                        <div id="${detailId}" class="detail-block">
                            <h3 style="color:var(--text-main); margin-bottom:5px;">${cls.name}</h3>
                            <p style="margin-bottom: 20px; color: var(--text-muted); font-size:12px;">
                                Found ${cls.count} times. Usage Context:
                            </p>
                            ${samplesHtml}
                        </div>
                    `;

        return `
                        <tr>
                        <td colspan="3" style="padding:0;">
                            <a href="#${detailId}" class="class-row-link">
                                <div style="display:flex; padding: 12px 15px;">
                                    <div style="flex:1.5; font-family:'Fira Code'; color:var(--accent)">${cls.name}</div>
                                    <div style="flex:0.5; color:var(--text-main)">${cls.count}</div>
                                    <div style="flex:2; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${tags}</div>
                                </div>
                            </a>
                        </td>
                        </tr>
                    `;
    }).join('')}
                </tbody>
                </table>
                
                <h2 style="margin-top: 40px">All HTML Tags</h2>
                <table>
                <thead>
                    <tr>
                    <th>Tag Name</th>
                    <th>Count</th>
                    <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.tagFrequency.map(tag => {
        const percentage = ((tag.count / data.metadata.totalElements) * 100).toFixed(1);
        return `
                        <tr>
                        <td><code>&lt;${tag.name}&gt;</code></td>
                        <td>${tag.count}</td>
                        <td>${percentage}%</td>
                        </tr>
                    `;
    }).join('')}
                </tbody>
                </table>
            </div>
            
            <div class="preview-column">
                <div class="preview-placeholder">
                    <i>⚡</i>
                    <span>Select a class to analyze structure</span>
                </div>
                ${previewBlocks}
            </div>
        </div>
    </div>
  </div>
</body>
</html>  `;
}