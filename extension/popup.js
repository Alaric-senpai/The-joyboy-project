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
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>joyboy Analysis Results</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #18191d; color: #ffffff; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1 { color: #6d4aff; margin-bottom: 10px; }
    h2 { color: #aeb0b7; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #363645; padding-bottom: 8px; font-weight: 600; }
    .metadata { background: #24242d; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 1px solid #363645; }
    .metadata p { margin: 5px 0; color: #aeb0b7; }
    .metadata strong { color: #ffffff; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat { background: #24242d; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 1px solid #363645; }
    .stat .number { font-size: 24px; font-weight: bold; color: #6d4aff; }
    .stat .label { display: block; color: #aeb0b7; font-size: 12px; margin-top: 5px; }
    .class-group { background: #24242d; padding: 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .class-name { font-family: monospace; font-weight: bold; color: #ff79c6; }
    .tag { display: inline-block; background: #363645; color: #ffffff; padding: 3px 8px; margin: 2px; border-radius: 4px; font-size: 12px; font-family: monospace; }
    table { width: 100%; border-collapse: collapse; background: #24242d; margin: 10px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.2); border: 1px solid #363645; }
    th { background: #1f1f2e; color: #ffffff; padding: 12px; text-align: left; border-bottom: 1px solid #363645; }
    td { padding: 12px; border-bottom: 1px solid #363645; color: #aeb0b7; }
    tr:hover { background: #2f2f3a; }
    code { background: #18191d; color: #50fa7b; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    
    /* CSS Tabs Styles */
    .tabs-container {
        display: flex;
        flex-direction: column;
    }
    .tabs-nav {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        border-bottom: 1px solid #363645;
        padding-bottom: 10px;
    }
    /* Hide radio inputs */
    input[name="tab-group"] {
        display: none;
    }
    
    /* Tab Labels (act as buttons) */
    .tab-label {
        background: transparent;
        border: none;
        color: #aeb0b7;
        padding: 10px 20px;
        font-size: 16px;
        cursor: pointer;
        border-radius: 6px;
        transition: all 0.2s;
        font-weight: 500;
        user-select: none;
    }
    .tab-label:hover {
        background: #2f2f3a;
        color: #fff;
    }
    
    /* Active State based on checked radio */
    #tab-overview:checked ~ .tabs-nav label[for="tab-overview"],
    #tab-datalog:checked ~ .tabs-nav label[for="tab-datalog"] {
        background: #6d4aff;
        color: #fff;
    }
    
    /* Content Visibility */
    .tab-content {
        display: none;
        animation: fadeIn 0.3s ease-in-out;
    }
    
    #tab-overview:checked ~ #content-overview,
    #tab-datalog:checked ~ #content-datalog {
        display: block;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>joyboy DOM Analysis Results</h1>
    
    <div class="metadata">
      <p><strong>URL:</strong> ${data.metadata.url}</p>
      <p><strong>Title:</strong> ${data.metadata.title}</p>
      <p><strong>Analyzed:</strong> ${new Date(data.metadata.timestamp).toLocaleString()}</p>
    </div>

    <!-- CSS Tabs Structure -->
    <div class="tabs-container">
        <!-- Radio Inputs -->
        <input type="radio" name="tab-group" id="tab-overview" checked>
        <input type="radio" name="tab-group" id="tab-datalog">

        <!-- Navigation (Labels) -->
        <div class="tabs-nav">
            <label for="tab-overview" class="tab-label">Overview</label>
            <label for="tab-datalog" class="tab-label">Data Log</label>
        </div>

        <!-- OVERVIEW TAB CONTENT -->
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

        <!-- DATA LOG TAB CONTENT -->
        <div id="content-datalog" class="tab-content">
            <h2>All Classes (Sorted by Frequency)</h2>
            <table>
            <thead>
                <tr>
                <th>Class Name</th>
                <th>Usage Count</th>
                <th>Tags Used On</th>
                </tr>
            </thead>
            <tbody>
                ${data.frequency.map(cls => {
        const classData = data.classes[cls.name];
        // Show more tags in detail view
        const tags = Object.keys(classData.tags).map(t => `<span class="tag">${t}</span>`).join(' ');
        return `
                    <tr>
                    <td><code class="class-name">${cls.name}</code></td>
                    <td>${cls.count}</td>
                    <td>${tags}</td>
                    </tr>
                `;
    }).join('')}
            </tbody>
            </table>

            <h2>All HTML Tags</h2>
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
    </div> <!-- End tabs-container -->

  </div>
</body>
</html>  `;
}