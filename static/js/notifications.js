// Handle notifications functionality

// Check for pending reminders
async function checkPendingReminders() {
    try {
        const response = await fetch('/api/reminders');
        if (!response.ok) {
            throw new Error('Failed to fetch reminders');
        }
        
        const data = await response.json();
        
        if (data.success && data.reminders && data.reminders.length > 0) {
            // Process reminders and check if any are due
            const now = new Date();
            const dueReminders = data.reminders.filter(reminder => {
                const reminderTime = new Date(reminder.reminder_time);
                // Reminder is due if it's within the last minute or up to 5 minutes in the future
                const diffMs = reminderTime - now;
                return diffMs >= -60000 && diffMs <= 300000; // Between -1 and +5 minutes
            });
            
            // Display notifications for due reminders
            dueReminders.forEach(reminder => {
                showReminderNotification(reminder);
            });
        }
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
    
    // Check again in 1 minute
    setTimeout(checkPendingReminders, 60000);
}

// Show a notification for a due reminder
function showReminderNotification(reminder) {
    // Check if the browser supports notifications
    if (!window.Notification) {
        // If notifications aren't supported, use our custom notification UI
        showNotification('Reminder', reminder.title, 'info');
        return;
    }
    
    // Check if permission has already been granted
    if (Notification.permission === 'granted') {
        createBrowserNotification(reminder);
    }
    // Otherwise, request permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            // If permission is granted, create a notification
            if (permission === 'granted') {
                createBrowserNotification(reminder);
            } else {
                // Fall back to our custom notification UI
                showNotification('Reminder', reminder.title, 'info');
            }
        });
    } else {
        // Fall back to our custom notification UI if notifications are denied
        showNotification('Reminder', reminder.title, 'info');
    }
}

// Create a browser notification
function createBrowserNotification(reminder) {
    const reminderTime = new Date(reminder.reminder_time);
    const formattedTime = reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const notification = new Notification('Reminder: ' + reminder.title, {
        body: `${reminder.description || ''}\nTime: ${formattedTime}`,
        icon: '/static/img/logo.svg',
        tag: `reminder-${reminder.id}`
    });
    
    // Handle click event
    notification.onclick = function() {
        window.focus();
        notification.close();
        
        // Scroll to reminders section if it exists
        const remindersSection = document.getElementById('remindersSection');
        if (remindersSection) {
            remindersSection.scrollIntoView({ behavior: 'smooth' });
        }
    };
    
    // Also show in the app UI
    showNotification('Reminder', reminder.title, 'info');
    
    // Play a sound if possible
    try {
        const audio = new Audio('/static/audio/notification.mp3');
        audio.play();
    } catch (e) {
        console.log('Could not play notification sound');
    }
}

// Schedule a reminder check on page load
document.addEventListener('DOMContentLoaded', function() {
    // Request notification permission on page load
    if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // Show a custom UI to explain why notifications are useful
        const notificationPrompt = document.getElementById('notificationPrompt');
        if (notificationPrompt) {
            notificationPrompt.classList.remove('hidden');
            
            const enableNotificationsBtn = document.getElementById('enableNotifications');
            if (enableNotificationsBtn) {
                enableNotificationsBtn.addEventListener('click', function() {
                    Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                            showNotification('Notifications Enabled', 'You\'ll now receive reminders even when the app is in the background.', 'success');
                        }
                        notificationPrompt.classList.add('hidden');
                    });
                });
            }
            
            const dismissNotificationsBtn = document.getElementById('dismissNotifications');
            if (dismissNotificationsBtn) {
                dismissNotificationsBtn.addEventListener('click', function() {
                    notificationPrompt.classList.add('hidden');
                });
            }
        }
    }
    
    // Start checking for reminders
    checkPendingReminders();
});
