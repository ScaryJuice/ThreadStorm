// ==UserScript==
// @name         ThreadStorm - Mass Thread Opener
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Storm through multiple forum threads at once with customizable delays
// @author       OpenCode Assistant
// @match        *://*/*
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        defaultDelay: 200,
        maxTabsWarning: 20,
        buttonContainerId: 'threadstorm-container',
        settingsModalId: 'threadstorm-settings'
    };

    // Settings management
    const settings = {
        get: (key, defaultValue) => GM_getValue(key, defaultValue),
        set: (key, value) => GM_setValue(key, value)
    };

    // Initialize settings
    const delay = settings.get('tabDelay', CONFIG.defaultDelay);

    // Main styles
    const styles = `
        #${CONFIG.buttonContainerId} {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: #2c2c2c;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: none;
        }

        #${CONFIG.buttonContainerId}.show {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: all;
        }

        .threadstorm-button {
            display: block;
            width: 180px;
            margin: 5px 0;
            padding: 8px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translateX(0);
        }

        .threadstorm-button:hover {
            transform: translateY(-2px) translateX(2px);
            box-shadow: 0 6px 12px rgba(102, 126, 234, 0.5);
            background: linear-gradient(135deg, #7c8ff0 0%, #8459a8 100%);
        }

        .threadstorm-button:active {
            transform: translateY(0) translateX(1px);
            transition: all 0.1s ease;
        }

        .threadstorm-button.settings {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            width: 100%;
        }

        .threadstorm-button.settings:hover {
            background: linear-gradient(135deg, #fa4ffc 0%, #ff4478 100%);
        }

        .threadstorm-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: translateY(0) translateX(0) !important;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.4; }
        }

        .threadstorm-progress {
            margin-top: 10px;
            padding: 8px;
            background: #1a1a1a;
            border-radius: 4px;
            font-size: 12px;
            color: #ccc;
            text-align: center;
            opacity: 0;
            transform: translateY(-5px);
            transition: all 0.3s ease;
        }

        .threadstorm-progress.show {
            opacity: 1;
            transform: translateY(0);
        }

        #${CONFIG.settingsModalId} {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            background: #2c2c2c;
            border: 1px solid #444;
            border-radius: 8px;
            padding: 20px;
            z-index: 10001;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
            min-width: 300px;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #${CONFIG.settingsModalId}.show {
            display: block;
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        .modal-backdrop {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .modal-backdrop.show {
            display: block;
            opacity: 1;
        }

        .modal-title {
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
        }

        .modal-input {
            width: 100%;
            padding: 8px;
            margin: 10px 0;
            background: #1a1a1a;
            border: 1px solid #444;
            border-radius: 4px;
            color: #fff;
        }

        .modal-buttons {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .modal-button {
            flex: 1;
            padding: 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }

        .modal-button.save {
            background: #667eea;
            color: white;
        }

        .modal-button.cancel {
            background: #444;
            color: #ccc;
        }

        .threadstorm-toggle {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 9999;
            background: #2c2c2c;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 8px 12px;
            color: white;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform: scale(1);
        }

        .threadstorm-toggle:hover {
            background: #3c3c3c;
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .threadstorm-toggle:active {
            transform: scale(0.98);
        }

        .threadstorm-toggle.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
        }
    `;

    // Inject styles
    function injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = styles;
        document.head.appendChild(styleElement);
    }

    // Universal thread detection functions
    function getLatestThreads() {
        const latestLinks = [];
        // Various patterns for "latest" links across different forums
        const selectors = [
            'a[href*="/latest"]',
            'a[href*="/newest"]',
            'a[href*="/last"]',
            'a[href*="/recent"]',
            'a.latest',
            'a.newest',
            'a[title*="latest"]',
            'a[title*="newest"]'
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.includes('#')) {
                    latestLinks.push(href.startsWith('http') ? href : new URL(href, window.location.href).href);
                }
            });
        });
        return [...new Set(latestLinks)]; // Remove duplicates
    }

    function getUnreadThreads() {
        const unreadLinks = [];
        // Various patterns for unread threads across different forums
        // More specific selectors to avoid false positives
        const selectors = [
            '.is-unread a[href*="/unread"]',  // XenForo style
            '.unread a[href*="/unread"]',     // Generic unread class with unread links
            '.new a[href*="/unread"]',        // New posts that are unread
            'a[href*="/unread"]:not([href*="/page-"])', // Direct unread links, exclude pagination
            'a.unread',                       // Direct unread class on links
            'a[title*="unread"]',             // Title attributes indicating unread
            'a[title*="new post"]'            // Title attributes for new posts
        ];

        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(link => {
                const href = link.getAttribute('href');
                if (href && !href.includes('#') && href.includes('/unread')) {
                    unreadLinks.push(href.startsWith('http') ? href : new URL(href, window.location.href).href);
                }
            });
        });
        return [...new Set(unreadLinks)]; // Remove duplicates
    }



    // Tab opening with delay
    async function openTabsWithDelay(urls, delayMs) {
        const progressBar = document.querySelector('.threadstorm-progress');
        let openedCount = 0;
        
        for (let i = 0; i < urls.length; i++) {
            try {
                GM_openInTab(urls[i], { active: false });
                openedCount++;
                if (progressBar) {
                    progressBar.textContent = `Opened ${openedCount}/${urls.length} tabs...`;
                }
                
                if (i < urls.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            } catch (error) {
                console.error('Failed to open tab:', error);
            }
        }
        
        if (progressBar) {
            progressBar.textContent = `Complete! Opened ${openedCount} tabs.`;
            setTimeout(() => {
                progressBar.classList.remove('show');
                setTimeout(() => {
                    progressBar.style.display = 'none';
                }, 300);
            }, 2000);
        }
    }

    // Confirmation dialog
    function confirmOpenTabs(count, action) {
        if (count > CONFIG.maxTabsWarning) {
            return confirm(`You're about to open ${count} tabs with the "${action}" action. This might slow down your browser. Continue?`);
        }
        return true;
    }

    // Create button container
    function createButtonContainer() {
        const container = document.createElement('div');
        container.id = CONFIG.buttonContainerId;
        container.innerHTML = `
            <button class="threadstorm-button" data-action="latest">Open Latest Posts</button>
            <button class="threadstorm-button" data-action="unread">Open Unread Only</button>
            <button class="threadstorm-button settings">⚙️ Settings</button>
            <div class="threadstorm-progress" style="display: none;"></div>
        `;
        return container;
    }

    // Create settings modal
    function createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = CONFIG.settingsModalId;
        modal.innerHTML = `
            <div class="modal-title">ThreadStorm Settings</div>
            <div>
                <label for="delay-input" style="color: #ccc; font-size: 13px;">Delay between tabs (milliseconds):</label>
                <input type="number" id="delay-input" class="modal-input" min="50" max="2000" step="50" value="${delay}">
            </div>
            <div class="modal-buttons">
                <button class="modal-button save">Save</button>
                <button class="modal-button cancel">Cancel</button>
            </div>
        `;
        return modal;
    }

    // Create modal backdrop
    function createModalBackdrop() {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        return backdrop;
    }

    // Show/hide modal
    function showModal() {
        const modal = document.getElementById(CONFIG.settingsModalId);
        const backdrop = document.querySelector('.modal-backdrop');
        
        modal.style.display = 'block';
        backdrop.style.display = 'block';
        
        setTimeout(() => {
            modal.classList.add('show');
            backdrop.classList.add('show');
        }, 10);
    }

    function hideModal() {
        const modal = document.getElementById(CONFIG.settingsModalId);
        const backdrop = document.querySelector('.modal-backdrop');
        
        modal.classList.remove('show');
        backdrop.classList.remove('show');
        
        setTimeout(() => {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
        }, 300);
    }

    // Save settings
    function saveSettings() {
        const delayInput = document.getElementById('delay-input');
        const newDelay = parseInt(delayInput.value);
        
        if (newDelay >= 50 && newDelay <= 2000) {
            settings.set('tabDelay', newDelay);
            hideModal();
        }
    }

    // Main initialization
    function initializeThreadStorm() {
        // Check if we're on a page with threads (universal detection)
        const hasThreads = document.querySelector(`
            .structItem--thread, 
            a[href*="/threads/"],
            a[href*="/thread"],
            a[href*="/topic"], 
            a[href*="/topics"],
            a[href*="/post"],
            a[href*="/discussion"],
            tr.thread,
            td.topic,
            li.thread,
            .thread,
            .topic,
            .thread-title,
            .topic-title
        `);
        if (!hasThreads) return;

        injectStyles();

        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'threadstorm-toggle';
        toggleButton.textContent = '🌪️ ThreadStorm';
        toggleButton.onclick = () => {
            const container = document.getElementById(CONFIG.buttonContainerId);
            if (container.style.display === 'none' || !container.classList.contains('show')) {
                // Show panel with animation
                container.style.display = 'block';
                toggleButton.classList.add('active');
                setTimeout(() => container.classList.add('show'), 10);
            } else {
                // Hide panel with animation
                container.classList.remove('show');
                toggleButton.classList.remove('active');
                setTimeout(() => {
                    if (!container.classList.contains('show')) {
                        container.style.display = 'none';
                    }
                }, 300);
            }
        };
        document.body.appendChild(toggleButton);

        // Create main container
        const container = createButtonContainer();
        document.body.appendChild(container);

        // Create modal and backdrop
        const modal = createSettingsModal();
        const backdrop = createModalBackdrop();
        document.body.appendChild(modal);
        document.body.appendChild(backdrop);

        // Event listeners for buttons
        container.querySelectorAll('.threadstorm-button[data-action]').forEach(button => {
            button.addEventListener('click', async (e) => {
                const action = e.target.dataset.action;
                let urls = [];
                let actionName = '';

                switch (action) {
                    case 'latest':
                        urls = getLatestThreads();
                        actionName = 'Open Latest Posts';
                        break;
                    case 'unread':
                        urls = getUnreadThreads();
                        actionName = 'Open Unread Only';
                        break;

                }

                if (urls.length === 0) {
                    alert('No threads found for this action on the current page.');
                    return;
                }

                if (!confirmOpenTabs(urls.length, actionName)) {
                    return;
                }

                // Disable buttons and show progress
                container.querySelectorAll('.threadstorm-button[data-action]').forEach(btn => {
                    btn.disabled = true;
                });
                
                const progressBar = container.querySelector('.threadstorm-progress');
                progressBar.style.display = 'block';
                progressBar.textContent = 'Starting...';
                setTimeout(() => progressBar.classList.add('show'), 10);

                // Open tabs
                await openTabsWithDelay(urls, settings.get('tabDelay', CONFIG.defaultDelay));

                // Re-enable buttons
                container.querySelectorAll('.threadstorm-button[data-action]').forEach(btn => {
                    btn.disabled = false;
                });
            });
        });

        // Settings button
        container.querySelector('.threadstorm-button.settings').addEventListener('click', showModal);

        // Modal event listeners
        modal.querySelector('.modal-button.save').addEventListener('click', saveSettings);
        modal.querySelector('.modal-button.cancel').addEventListener('click', hideModal);
        backdrop.addEventListener('click', hideModal);

        // Hide main container initially
        container.style.display = 'none';

        // Add click-outside listener to collapse panel
        document.addEventListener('click', function(event) {
            const container = document.getElementById(CONFIG.buttonContainerId);
            const toggleButton = document.querySelector('.threadstorm-toggle');
            
            // Check if click is outside both container and toggle button and panel is visible
            if (container && 
                (container.style.display === 'block' || container.classList.contains('show')) &&
                !container.contains(event.target) && 
                !toggleButton.contains(event.target)) {
                // Hide with animation
                container.classList.remove('show');
                toggleButton.classList.remove('active');
                setTimeout(() => {
                    if (!container.classList.contains('show')) {
                        container.style.display = 'none';
                    }
                }, 300);
            }
        });

        // Prevent click inside container from bubbling up
        container.addEventListener('click', function(event) {
            event.stopPropagation();
        });

        // Prevent toggle button from bubbling up
        toggleButton.addEventListener('click', function(event) {
            event.stopPropagation();
        });
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeThreadStorm);
    } else {
        initializeThreadStorm();
    }

})();