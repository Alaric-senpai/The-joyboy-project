/**
 * joyboy-extractor Background Service Worker
 * Handles AI integration, storage, and cross-tab communication
 */

// Configuration for Moonshot AI API
const MOONSHOT_CONFIG = {
    baseURL: 'https://api.moonshot.ai/v1',
    model: 'kimi-k2-turbo-preview'
};

/**
 * Handle installation
 */
chrome.runtime.onInstalled.addListener(() => {
    console.log('[joyboy] Extension installed');

    // Initialize default settings with sync storage (persists across sessions)
    chrome.storage.sync.get('settings', (result) => {
        if (!result.settings) {
            const defaultSettings = {
                moonShotApiKey: '',
                enableAI: false,
                theme: 'dark'
            };
            chrome.storage.sync.set({ settings: defaultSettings }, () => {
                console.log('[joyboy] Default settings initialized');
            });
        }
    });

    // Initialize empty analysis results
    chrome.storage.local.get('analysisResults', (result) => {
        if (!result.analysisResults) {
            chrome.storage.local.set({ analysisResults: [] }, () => {
                console.log('[joyboy] Analysis results storage initialized');
            });
        }
    });
});

/**
 * Listen for messages from content script and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeDom') {
        handleDomAnalysis(sender.tab.id, sendResponse);
        return true;
    }

    if (request.action === 'analyzeWithAI') {
        handleDomAnalysisWithAI(sender.tab.id, request.options, sendResponse);
        return true;
    }

    if (request.action === 'saveSettings') {
        saveSettings(request.settings, sendResponse);
        return true;
    }

    if (request.action === 'getSettings') {
        getSettings(sendResponse);
        return true;
    }

    if (request.action === 'getAnalysisResults') {
        getAnalysisResults(sendResponse);
        return true;
    }

    if (request.action === 'deleteAnalysisResult') {
        deleteAnalysisResult(request.id, sendResponse);
        return true;
    }

    if (request.action === 'clearAllResults') {
        clearAllResults(sendResponse);
        return true;
    }

    // Keep channel open for async response
    return true;
});

/**
 * Handle DOM analysis via content script
 */
function handleDomAnalysis(tabId, sendResponse) {
    chrome.tabs.sendMessage(tabId, { action: 'analyzeDom' }, (response) => {
        if (chrome.runtime.lastError) {
            console.error('[joyboy] Error:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
            saveAnalysisResult(response.data, tabId, null, (result) => {
                sendResponse({
                    success: true,
                    data: response.data,
                    resultId: result.id
                });
            });
        }
    });
}

/**
 * Handle DOM analysis with AI enhancement
 */
async function handleDomAnalysisWithAI(tabId, options, sendResponse) {
    try {
        // First get the DOM analysis
        chrome.tabs.sendMessage(tabId, { action: 'analyzeWithAI' }, async (response) => {
            if (chrome.runtime.lastError) {
                sendResponse({ success: false, error: chrome.runtime.lastError.message });
                return;
            }

            // Check if AI is enabled and API key is set
            chrome.storage.sync.get('settings', async (syncResult) => {
                const settings = syncResult.settings || getDefaultSettings();

                if (!settings.enableAI || !settings.moonShotApiKey) {
                    saveAnalysisResult(response.data, tabId, null, (result) => {
                        sendResponse({
                            success: true,
                            data: response.data,
                            aiAnalysis: null,
                            resultId: result.id,
                            message: 'AI not enabled or API key not configured'
                        });
                    });
                    return;
                }

                try {
                    // Send to AI for analysis
                    const aiAnalysis = await analyzeWithMoonshot(response.data, settings, options);
                    saveAnalysisResult(response.data, tabId, aiAnalysis, (result) => {
                        sendResponse({
                            success: true,
                            data: response.data,
                            aiAnalysis: aiAnalysis,
                            resultId: result.id
                        });
                    });
                } catch (error) {
                    console.error('[joyboy] AI analysis error:', error);
                    saveAnalysisResult(response.data, tabId, null, (result) => {
                        sendResponse({
                            success: true,
                            data: response.data,
                            aiAnalysis: null,
                            resultId: result.id,
                            error: error.message
                        });
                    });
                }
            });
        });
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Analyze DOM structure with Moonshot AI
 */
async function analyzeWithMoonshot(domData, settings, options) {
    // Prepare summary for AI analysis
    const summary = {
        totalElements: domData.metadata.totalElements,
        uniqueClasses: domData.metadata.uniqueClasses,
        topClasses: domData.frequency.slice(0, 10),
        topTags: domData.tagFrequency.slice(0, 10),
        patterns: domData.patterns.slice(0, 5),
        url: domData.metadata.url
    };

    const systemPrompt = `You are an expert web developer and UX architect. Analyze the provided DOM structure and CSS class usage patterns. Provide insights about:
1. Component architecture and reusability
2. CSS organization and potential improvements
3. Accessibility patterns and gaps
4. Performance implications
5. Recommended refactoring opportunities

Be concise, actionable, and focus on practical improvements.`;

    const userPrompt = `Analyze this website's DOM structure:

URL: ${summary.url}
Total Elements: ${summary.totalElements}
Unique CSS Classes: ${summary.uniqueClasses}

Top Classes:
${summary.topClasses.map(c => `- ${c.name} (${c.count} uses)`).join('\n')}

Top HTML Tags:
${summary.topTags.map(t => `- ${t.name} (${t.count} uses)`).join('\n')}

Common Class Combinations:
${summary.patterns.map(p => `- [${p.classes.join(', ')}] (${p.frequency} times)`).join('\n')}

Provide a structured analysis with specific, actionable recommendations.`;

    const response = await fetch(`${MOONSHOT_CONFIG.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.moonShotApiKey}`
        },
        body: JSON.stringify({
            model: MOONSHOT_CONFIG.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.6,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Moonshot API error: ${response.status} ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
        analysis: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
        model: MOONSHOT_CONFIG.model
    };
}

/**
 * Save analysis result to storage (persists across sessions)
 */
function saveAnalysisResult(data, tabId, aiAnalysis = null, callback) {
    chrome.storage.local.get('analysisResults', (result) => {
        const results = result.analysisResults || [];

        const analysisResult = {
            id: Date.now(),
            url: data.metadata.url,
            title: data.metadata.title,
            timestamp: data.metadata.timestamp,
            summary: {
                totalElements: data.metadata.totalElements,
                uniqueClasses: data.metadata.uniqueClasses,
                uniqueTags: data.metadata.uniqueTags
            },
            data: data,
            aiAnalysis: aiAnalysis
        };

        results.unshift(analysisResult);

        // Keep only last 100 results
        if (results.length > 100) {
            results.pop();
        }

        chrome.storage.local.set({ analysisResults: results }, () => {
            console.log('[joyboy] Analysis saved with ID:', analysisResult.id);
            if (callback) callback(analysisResult);
        });
    });
}

/**
 * Get all analysis results
 */
function getAnalysisResults(sendResponse) {
    chrome.storage.local.get('analysisResults', (result) => {
        const results = result.analysisResults || [];
        sendResponse({
            success: true,
            results: results
        });
    });
}

/**
 * Delete specific analysis result
 */
function deleteAnalysisResult(id, sendResponse) {
    chrome.storage.local.get('analysisResults', (result) => {
        let results = result.analysisResults || [];
        results = results.filter(r => r.id != id);

        chrome.storage.local.set({ analysisResults: results }, () => {
            console.log('[joyboy] Analysis result deleted:', id);
            sendResponse({ success: true });
        });
    });
}

/**
 * Clear all results
 */
function clearAllResults(sendResponse) {
    chrome.storage.local.set({ analysisResults: [] }, () => {
        console.log('[joyboy] All analysis results cleared');
        sendResponse({ success: true });
    });
}

/**
 * Get default settings
 */
function getDefaultSettings() {
    return {
        moonShotApiKey: '',
        enableAI: false,
        theme: 'light'
    };
}

/**
 * Save settings to sync storage (persists across sessions and devices)
 */
function saveSettings(settings, sendResponse) {
    chrome.storage.sync.set({ settings }, () => {
        console.log('[joyboy] Settings saved to sync storage');
        sendResponse({ success: true });
    });
}

/**
 * Get settings from sync storage
 */
function getSettings(sendResponse) {
    chrome.storage.sync.get('settings', (result) => {
        const settings = result.settings || getDefaultSettings();
        sendResponse({
            success: true,
            settings: settings
        });
    });
}

console.log('[joyboy] Background service worker loaded');