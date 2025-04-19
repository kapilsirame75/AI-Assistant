// Main JavaScript file for the AI Assistant app

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application components
    initCommandInput();
    initQuickActions();
    initTasks();
    initReminders();
    initWeather();
    initNews();
    initFileUpload();
    
    // Check for notifications that need to be displayed
    checkPendingReminders();
    
    // Register service worker for notifications if supported
    if ('serviceWorker' in navigator) {
        registerServiceWorker();
    }
});

// Initialize the command input functionality
function initCommandInput() {
    const commandForm = document.getElementById('commandForm');
    const commandInput = document.getElementById('commandInput');
    const commandSubmit = document.getElementById('commandSubmit');
    
    if (!commandForm) return;
    
    commandForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const command = commandInput.value.trim();
        if (!command) return;
        
        // Disable input and button during processing
        commandInput.disabled = true;
        commandSubmit.disabled = true;
        
        // Process the command
        processCommand(command)
            .then(response => {
                // Display response in the chat area
                displayCommandResponse(command, response);
                
                // Reset the input field
                commandInput.value = '';
                
                // Refresh relevant sections based on the intent
                if (response.success) {
                    if (response.message.includes('Task')) {
                        refreshTasks();
                    } else if (response.message.includes('Reminder')) {
                        refreshReminders();
                    } else if (response.intent === 'weather') {
                        refreshWeather(response.weather);
                    } else if (response.intent === 'news') {
                        refreshNews(response.news);
                    }
                }
            })
            .catch(error => {
                console.error('Command processing error:', error);
                showNotification('Error', 'Could not process your command. Please try again.', 'error');
            })
            .finally(() => {
                // Re-enable input and button
                commandInput.disabled = false;
                commandSubmit.disabled = false;
                commandInput.focus();
            });
    });
}

// Process a natural language command
async function processCommand(command) {
    try {
        const response = await fetch('/api/process-command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ command })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error processing command:', error);
        return {
            success: false,
            message: 'Error processing your command. Please try again.'
        };
    }
}

// Display the command and its response in the chat area
function displayCommandResponse(command, response) {
    const chatArea = document.getElementById('chatArea');
    if (!chatArea) return;
    
    // Create elements for the command and response
    const commandEl = document.createElement('div');
    commandEl.className = 'card mb-2 fade-in';
    
    let commandHtml = `
        <div class="card-header">
            <span class="font-weight-bold">You</span>
            <small class="text-muted">${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="card-body">
            <p>${escapeHtml(command)}</p>
        </div>
    `;
    commandEl.innerHTML = commandHtml;
    chatArea.appendChild(commandEl);
    
    // Create response element
    const responseEl = document.createElement('div');
    responseEl.className = 'card mb-3 fade-in';
    
    let responseContent = '';
    if (response.success) {
        if (response.answer) {
            // Question answering response
            responseContent = escapeHtml(response.answer);
        } else if (response.weather) {
            // Weather response
            const weather = response.weather;
            responseContent = `
                <div class="weather-widget">
                    <div class="weather-info">
                        <div class="weather-location">${escapeHtml(weather.location)}</div>
                        <div class="weather-temp">${weather.temperature_c}°C / ${weather.temperature_f}°F</div>
                        <div class="weather-condition">${escapeHtml(weather.condition)}</div>
                    </div>
                    <div class="weather-icon">
                        <i class="fas fa-cloud"></i>
                    </div>
                </div>
            `;
        } else if (response.news) {
            // News response
            responseContent = '<div class="news-list">';
            response.news.slice(0, 3).forEach(item => {
                responseContent += `
                    <div class="news-item">
                        <div class="news-title">${escapeHtml(item.title)}</div>
                        <div class="news-description">${escapeHtml(item.description)}</div>
                        <div class="news-meta">${formatDate(item.publishedAt)}</div>
                    </div>
                `;
            });
            responseContent += '</div>';
        } else if (response.task) {
            // Task creation response
            responseContent = `
                <p>${escapeHtml(response.message)}</p>
                <div class="task-item mt-2">
                    <span class="task-title">${escapeHtml(response.task.title)}</span>
                    <span class="task-date">${response.task.deadline ? formatDate(response.task.deadline) : 'No deadline'}</span>
                </div>
            `;
        } else if (response.reminder) {
            // Reminder creation response
            responseContent = `
                <p>${escapeHtml(response.message)}</p>
                <div class="reminder-item mt-2">
                    <span class="reminder-title">${escapeHtml(response.reminder.title)}</span>
                    <span class="reminder-time">${formatDate(response.reminder.reminder_time)}</span>
                </div>
            `;
        } else {
            // General success response
            responseContent = escapeHtml(response.message);
        }
    } else {
        // Error response
        responseContent = `<p class="text-danger">${escapeHtml(response.message || 'Sorry, I couldn\'t process that command.')}</p>`;
    }
    
    let responseHtml = `
        <div class="card-header">
            <span class="font-weight-bold">Assistant</span>
            <small class="text-muted">${new Date().toLocaleTimeString()}</small>
        </div>
        <div class="card-body">
            ${responseContent}
        </div>
    `;
    responseEl.innerHTML = responseHtml;
    chatArea.appendChild(responseEl);
    
    // Scroll to the bottom of the chat area
    chatArea.scrollTop = chatArea.scrollHeight;
}

// Initialize quick action buttons
function initQuickActions() {
    const quickActions = document.querySelectorAll('.quick-action-btn');
    
    quickActions.forEach(button => {
        button.addEventListener('click', function() {
            const actionType = this.dataset.action;
            const commandInput = document.getElementById('commandInput');
            
            if (!commandInput) return;
            
            // Set different placeholder commands based on the action type
            switch (actionType) {
                case 'task':
                    commandInput.value = 'Add a task to ';
                    break;
                case 'reminder':
                    commandInput.value = 'Remind me to ';
                    break;
                case 'weather':
                    commandInput.value = 'What\'s the weather like in ';
                    break;
                case 'news':
                    commandInput.value = 'Show me the latest news about ';
                    break;
                case 'question':
                    commandInput.value = 'What is ';
                    break;
            }
            
            // Focus and place cursor at the end
            commandInput.focus();
            commandInput.selectionStart = commandInput.value.length;
        });
    });
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper function to format dates
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const dayInMs = 86400000; // 24 * 60 * 60 * 1000
    
    // If the date is today, show time only
    if (diff < dayInMs && date.getDate() === now.getDate()) {
        return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If the date is yesterday, show "Yesterday at time"
    if (diff < 2 * dayInMs && date.getDate() === now.getDate() - 1) {
        return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If the date is within 7 days, show day of week and time
    if (diff < 7 * dayInMs) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `${days[date.getDay()]} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise, show full date
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) + 
           ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Show a notification
function showNotification(title, message, type = 'info') {
    const notificationArea = document.getElementById('notificationArea');
    if (!notificationArea) return;
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type} fade-in`;
    
    notification.innerHTML = `
        <div class="notification-header">
            <div class="notification-title">${escapeHtml(title)}</div>
            <button class="notification-close">&times;</button>
        </div>
        <div class="notification-body">
            ${escapeHtml(message)}
        </div>
    `;
    
    // Add to notification area
    notificationArea.appendChild(notification);
    
    // Add event listener to close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', function() {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('fade-in');
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// Register service worker for notifications
function registerServiceWorker() {
    navigator.serviceWorker.register('/static/js/service-worker.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
}
