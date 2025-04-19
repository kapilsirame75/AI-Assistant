// Reminders management functionality

// Initialize the reminders module
function initReminders() {
    // Load reminders on page load
    loadReminders();
    
    // Setup event listeners for reminder operations
    setupReminderEventListeners();
}

// Load reminders from the server
async function loadReminders() {
    try {
        const response = await fetch('/api/reminders');
        if (!response.ok) {
            throw new Error('Failed to load reminders');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Render reminders
            renderReminders(data.reminders);
        } else {
            console.error('Error loading reminders:', data.message);
        }
    } catch (error) {
        console.error('Error loading reminders:', error);
        showNotification('Error', 'Could not load reminders. Please try again later.', 'error');
    }
}

// Render reminders in the reminders list
function renderReminders(reminders) {
    const reminderList = document.getElementById('reminderList');
    if (!reminderList) return;
    
    // Sort reminders by time (closest first)
    reminders.sort((a, b) => new Date(a.reminder_time) - new Date(b.reminder_time));
    
    // Clear existing reminders
    reminderList.innerHTML = '';
    
    if (reminders.length === 0) {
        reminderList.innerHTML = '<div class="p-3 text-center text-muted">No reminders yet. Use the command bar above to add one!</div>';
        return;
    }
    
    // Add reminders to the list
    reminders.forEach(reminder => {
        const reminderItem = document.createElement('li');
        reminderItem.className = 'reminder-item';
        reminderItem.dataset.id = reminder.id;
        
        // Create reminder title and description
        const reminderInfo = document.createElement('div');
        reminderInfo.className = 'reminder-title';
        
        const title = document.createElement('div');
        title.className = 'font-weight-medium';
        title.textContent = reminder.title;
        
        const description = document.createElement('div');
        description.className = 'text-muted';
        description.style.fontSize = 'var(--font-size-sm)';
        description.textContent = reminder.description || '';
        
        reminderInfo.appendChild(title);
        if (reminder.description) {
            reminderInfo.appendChild(description);
        }
        
        // Create reminder time display
        const reminderTime = document.createElement('div');
        reminderTime.className = 'reminder-time';
        
        const reminderDate = new Date(reminder.reminder_time);
        const now = new Date();
        const diffMs = reminderDate - now;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 0) {
            reminderTime.textContent = `${Math.abs(diffMins)} min ago`;
            reminderTime.classList.add('text-danger');
        } else if (diffMins < 60) {
            reminderTime.textContent = `In ${diffMins} min`;
            reminderTime.classList.add('text-warning');
        } else if (diffMins < 1440) { // Less than 24 hours
            const hours = Math.floor(diffMins / 60);
            reminderTime.textContent = `In ${hours} hour${hours !== 1 ? 's' : ''}`;
        } else {
            // Format date based on how far in the future
            const days = Math.floor(diffMins / 1440);
            if (days < 7) {
                reminderTime.textContent = `In ${days} day${days !== 1 ? 's' : ''}`;
            } else {
                reminderTime.textContent = reminderDate.toLocaleDateString() + ' at ' + 
                                          reminderDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            }
        }
        
        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline reminder-actions';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete reminder';
        deleteBtn.addEventListener('click', () => deleteReminder(reminder.id));
        
        // Assemble reminder item
        reminderItem.appendChild(reminderInfo);
        reminderItem.appendChild(reminderTime);
        reminderItem.appendChild(deleteBtn);
        
        reminderList.appendChild(reminderItem);
    });
}

// Delete a reminder
async function deleteReminder(reminderId) {
    // Confirm before deleting
    if (!confirm('Are you sure you want to delete this reminder?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/reminders/${reminderId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete reminder');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Remove the reminder from the UI
            const reminderItem = document.querySelector(`.reminder-item[data-id="${reminderId}"]`);
            if (reminderItem) {
                reminderItem.remove();
            }
            
            showNotification('Success', 'Reminder deleted successfully', 'success');
            
            // Refresh the reminders list
            loadReminders();
        } else {
            console.error('Error deleting reminder:', data.message);
            showNotification('Error', data.message || 'Could not delete reminder', 'error');
        }
    } catch (error) {
        console.error('Error deleting reminder:', error);
        showNotification('Error', 'Could not delete reminder. Please try again.', 'error');
    }
}

// Create a new reminder
async function createReminder(reminderData) {
    try {
        const response = await fetch('/api/reminders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reminderData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create reminder');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh the reminders list
            loadReminders();
            return data.reminder;
        } else {
            console.error('Error creating reminder:', data.message);
            showNotification('Error', data.message || 'Could not create reminder', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error creating reminder:', error);
        showNotification('Error', 'Could not create reminder. Please try again.', 'error');
        return null;
    }
}

// Refresh the reminders list
function refreshReminders() {
    loadReminders();
}

// Setup event listeners for reminder operations
function setupReminderEventListeners() {
    // Add reminder button
    const addReminderBtn = document.getElementById('addReminderBtn');
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', () => {
            // Create a modal for adding a new reminder
            const modalContainer = document.createElement('div');
            modalContainer.className = 'modal-container';
            modalContainer.style.position = 'fixed';
            modalContainer.style.top = '0';
            modalContainer.style.left = '0';
            modalContainer.style.width = '100%';
            modalContainer.style.height = '100%';
            modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            modalContainer.style.display = 'flex';
            modalContainer.style.alignItems = 'center';
            modalContainer.style.justifyContent = 'center';
            modalContainer.style.zIndex = '1000';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            modalContent.style.width = '90%';
            modalContent.style.maxWidth = '500px';
            modalContent.style.backgroundColor = 'white';
            modalContent.style.borderRadius = 'var(--border-radius-md)';
            modalContent.style.overflow = 'hidden';
            
            // Modal header
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            modalHeader.style.padding = 'var(--spacing-md)';
            modalHeader.style.borderBottom = '1px solid var(--light-gray)';
            modalHeader.style.display = 'flex';
            modalHeader.style.justifyContent = 'space-between';
            modalHeader.style.alignItems = 'center';
            
            const modalTitle = document.createElement('h3');
            modalTitle.textContent = 'Add New Reminder';
            modalTitle.style.margin = '0';
            
            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';
            closeButton.style.background = 'none';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '1.5rem';
            closeButton.style.cursor = 'pointer';
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeButton);
            
            // Modal body with form
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            modalBody.style.padding = 'var(--spacing-md)';
            
            const form = document.createElement('form');
            form.id = 'addReminderForm';
            
            // Reminder title field
            const titleGroup = document.createElement('div');
            titleGroup.className = 'form-group';
            
            const titleLabel = document.createElement('label');
            titleLabel.htmlFor = 'newReminderTitle';
            titleLabel.className = 'form-label';
            titleLabel.textContent = 'Reminder Title';
            
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.id = 'newReminderTitle';
            titleInput.className = 'form-control';
            titleInput.placeholder = 'Enter reminder title';
            titleInput.required = true;
            
            titleGroup.appendChild(titleLabel);
            titleGroup.appendChild(titleInput);
            
            // Reminder description field
            const descGroup = document.createElement('div');
            descGroup.className = 'form-group';
            
            const descLabel = document.createElement('label');
            descLabel.htmlFor = 'newReminderDescription';
            descLabel.className = 'form-label';
            descLabel.textContent = 'Description (optional)';
            
            const descInput = document.createElement('textarea');
            descInput.id = 'newReminderDescription';
            descInput.className = 'form-control';
            descInput.placeholder = 'Enter reminder description';
            descInput.rows = 3;
            
            descGroup.appendChild(descLabel);
            descGroup.appendChild(descInput);
            
            // Reminder time field
            const timeGroup = document.createElement('div');
            timeGroup.className = 'form-group';
            
            const timeLabel = document.createElement('label');
            timeLabel.htmlFor = 'newReminderTime';
            timeLabel.className = 'form-label';
            timeLabel.textContent = 'Reminder Time';
            
            const timeInput = document.createElement('input');
            timeInput.type = 'datetime-local';
            timeInput.id = 'newReminderTime';
            timeInput.className = 'form-control';
            timeInput.required = true;
            
            // Set default time 15 minutes from now
            const defaultTime = new Date();
            defaultTime.setMinutes(defaultTime.getMinutes() + 15);
            timeInput.value = defaultTime.toISOString().slice(0, 16);
            
            timeGroup.appendChild(timeLabel);
            timeGroup.appendChild(timeInput);
            
            // Add all form groups to the form
            form.appendChild(titleGroup);
            form.appendChild(descGroup);
            form.appendChild(timeGroup);
            
            modalBody.appendChild(form);
            
            // Modal footer with action buttons
            const modalFooter = document.createElement('div');
            modalFooter.className = 'modal-footer';
            modalFooter.style.padding = 'var(--spacing-md)';
            modalFooter.style.borderTop = '1px solid var(--light-gray)';
            modalFooter.style.display = 'flex';
            modalFooter.style.justifyContent = 'flex-end';
            modalFooter.style.gap = 'var(--spacing-sm)';
            
            const cancelButton = document.createElement('button');
            cancelButton.type = 'button';
            cancelButton.className = 'btn btn-outline';
            cancelButton.textContent = 'Cancel';
            cancelButton.addEventListener('click', () => {
                document.body.removeChild(modalContainer);
            });
            
            const saveButton = document.createElement('button');
            saveButton.type = 'button';
            saveButton.className = 'btn btn-primary';
            saveButton.textContent = 'Add Reminder';
            saveButton.addEventListener('click', async () => {
                // Get form values
                const newReminder = {
                    title: titleInput.value.trim(),
                    description: descInput.value.trim(),
                    reminder_time: timeInput.value
                };
                
                // Validate form
                if (!newReminder.title) {
                    showNotification('Error', 'Reminder title is required', 'error');
                    return;
                }
                
                if (!newReminder.reminder_time) {
                    showNotification('Error', 'Reminder time is required', 'error');
                    return;
                }
                
                // Create the reminder
                const createdReminder = await createReminder(newReminder);
                
                if (createdReminder) {
                    showNotification('Success', 'Reminder created successfully', 'success');
                    // Close the modal
                    document.body.removeChild(modalContainer);
                }
            });
            
            modalFooter.appendChild(cancelButton);
            modalFooter.appendChild(saveButton);
            
            // Assemble the modal
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modalContent.appendChild(modalFooter);
            modalContainer.appendChild(modalContent);
            
            // Add modal to the document
            document.body.appendChild(modalContainer);
            
            // Focus the title input
            titleInput.focus();
        });
    }
}
