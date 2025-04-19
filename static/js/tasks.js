// Task management functionality

// Initialize the tasks module
function initTasks() {
    // Load tasks on page load
    loadTasks();
    
    // Setup event listeners for task operations
    setupTaskEventListeners();
}

// Load tasks from the server
async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        if (!response.ok) {
            throw new Error('Failed to load tasks');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Render tasks
            renderTasks(data.tasks);
        } else {
            console.error('Error loading tasks:', data.message);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        showNotification('Error', 'Could not load tasks. Please try again later.', 'error');
    }
}

// Render tasks in the task list
function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    // Sort tasks: incomplete first (by deadline), then completed
    tasks.sort((a, b) => {
        // First sort by completion status
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
        // For incomplete tasks, sort by deadline (if available)
        if (!a.completed && !b.completed) {
            // If both have deadlines, compare them
            if (a.deadline && b.deadline) {
                return new Date(a.deadline) - new Date(b.deadline);
            }
            // Tasks with deadlines come before tasks without deadlines
            if (a.deadline) return -1;
            if (b.deadline) return 1;
        }
        
        // If all else is equal, sort by creation date (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
    });
    
    // Clear existing tasks
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="p-3 text-center text-muted">No tasks yet. Use the command bar above to add one!</div>';
        return;
    }
    
    // Add tasks to the list
    tasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'task-item';
        taskItem.dataset.id = task.id;
        
        // Create completion checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id, checkbox.checked));
        
        // Create task title
        const taskTitle = document.createElement('span');
        taskTitle.className = `task-title ${task.completed ? 'task-completed' : ''}`;
        taskTitle.textContent = task.title;
        
        // Create task date/deadline display
        const taskDate = document.createElement('span');
        taskDate.className = 'task-date';
        
        if (task.deadline) {
            const deadlineDate = new Date(task.deadline);
            const now = new Date();
            const diffDays = Math.floor((deadlineDate - now) / (1000 * 60 * 60 * 24));
            
            // Show different formatting based on deadline proximity
            if (diffDays < 0) {
                taskDate.textContent = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
                taskDate.classList.add('text-danger');
            } else if (diffDays === 0) {
                taskDate.textContent = 'Due today';
                taskDate.classList.add('text-warning');
            } else if (diffDays === 1) {
                taskDate.textContent = 'Due tomorrow';
            } else {
                taskDate.textContent = `Due in ${diffDays} days`;
            }
        } else {
            taskDate.textContent = 'No deadline';
        }
        
        // Create action buttons
        const taskActions = document.createElement('div');
        taskActions.className = 'task-actions';
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-outline';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.title = 'Edit task';
        editBtn.addEventListener('click', () => editTask(task));
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-outline';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete task';
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        // Assemble task item
        taskActions.appendChild(editBtn);
        taskActions.appendChild(deleteBtn);
        
        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskTitle);
        taskItem.appendChild(taskDate);
        taskItem.appendChild(taskActions);
        
        taskList.appendChild(taskItem);
    });
}

// Toggle task completion status
async function toggleTaskCompletion(taskId, completed) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ completed })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update task');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Update the task in the UI
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            if (taskItem) {
                const taskTitle = taskItem.querySelector('.task-title');
                if (completed) {
                    taskTitle.classList.add('task-completed');
                } else {
                    taskTitle.classList.remove('task-completed');
                }
            }
        } else {
            console.error('Error updating task:', data.message);
            showNotification('Error', data.message || 'Could not update task', 'error');
        }
    } catch (error) {
        console.error('Error updating task:', error);
        showNotification('Error', 'Could not update task. Please try again.', 'error');
    }
}

// Edit a task
function editTask(task) {
    // Create a modal for editing the task
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
    modalTitle.textContent = 'Edit Task';
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
    form.id = 'editTaskForm';
    
    // Task title field
    const titleGroup = document.createElement('div');
    titleGroup.className = 'form-group';
    
    const titleLabel = document.createElement('label');
    titleLabel.htmlFor = 'taskTitle';
    titleLabel.className = 'form-label';
    titleLabel.textContent = 'Task Title';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'taskTitle';
    titleInput.className = 'form-control';
    titleInput.value = task.title;
    titleInput.required = true;
    
    titleGroup.appendChild(titleLabel);
    titleGroup.appendChild(titleInput);
    
    // Task description field
    const descGroup = document.createElement('div');
    descGroup.className = 'form-group';
    
    const descLabel = document.createElement('label');
    descLabel.htmlFor = 'taskDescription';
    descLabel.className = 'form-label';
    descLabel.textContent = 'Description (optional)';
    
    const descInput = document.createElement('textarea');
    descInput.id = 'taskDescription';
    descInput.className = 'form-control';
    descInput.value = task.description || '';
    descInput.rows = 3;
    
    descGroup.appendChild(descLabel);
    descGroup.appendChild(descInput);
    
    // Task deadline field
    const deadlineGroup = document.createElement('div');
    deadlineGroup.className = 'form-group';
    
    const deadlineLabel = document.createElement('label');
    deadlineLabel.htmlFor = 'taskDeadline';
    deadlineLabel.className = 'form-label';
    deadlineLabel.textContent = 'Deadline (optional)';
    
    const deadlineInput = document.createElement('input');
    deadlineInput.type = 'datetime-local';
    deadlineInput.id = 'taskDeadline';
    deadlineInput.className = 'form-control';
    
    // Format the deadline for the datetime-local input
    if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        
        // Create ISO string and extract the datetime-local compatible part
        const isoDate = deadlineDate.toISOString();
        const localDatetime = isoDate.substring(0, isoDate.indexOf('T') + 6);
        
        deadlineInput.value = localDatetime;
    }
    
    deadlineGroup.appendChild(deadlineLabel);
    deadlineGroup.appendChild(deadlineInput);
    
    // Task completion status
    const completionGroup = document.createElement('div');
    completionGroup.className = 'form-group';
    
    const completionCheckbox = document.createElement('input');
    completionCheckbox.type = 'checkbox';
    completionCheckbox.id = 'taskCompleted';
    completionCheckbox.checked = task.completed;
    
    const completionLabel = document.createElement('label');
    completionLabel.htmlFor = 'taskCompleted';
    completionLabel.className = 'form-label ml-2';
    completionLabel.textContent = 'Mark as completed';
    completionLabel.style.display = 'inline-block';
    completionLabel.style.marginLeft = '8px';
    
    completionGroup.appendChild(completionCheckbox);
    completionGroup.appendChild(completionLabel);
    
    // Add all form groups to the form
    form.appendChild(titleGroup);
    form.appendChild(descGroup);
    form.appendChild(deadlineGroup);
    form.appendChild(completionGroup);
    
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
    saveButton.textContent = 'Save Changes';
    saveButton.addEventListener('click', async () => {
        // Get form values
        const updatedTask = {
            title: titleInput.value.trim(),
            description: descInput.value.trim(),
            completed: completionCheckbox.checked
        };
        
        // Add deadline if provided
        if (deadlineInput.value) {
            updatedTask.deadline = new Date(deadlineInput.value).toISOString();
        } else {
            updatedTask.deadline = null;
        }
        
        // Validate form
        if (!updatedTask.title) {
            showNotification('Error', 'Task title is required', 'error');
            return;
        }
        
        try {
            // Update the task
            const response = await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedTask)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update task');
            }
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Success', 'Task updated successfully', 'success');
                // Refresh the task list
                loadTasks();
                // Close the modal
                document.body.removeChild(modalContainer);
            } else {
                showNotification('Error', data.message || 'Failed to update task', 'error');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            showNotification('Error', 'Could not update task. Please try again.', 'error');
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
}

// Delete a task
async function deleteTask(taskId) {
    // Confirm before deleting
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete task');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Remove the task from the UI
            const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
            if (taskItem) {
                taskItem.remove();
            }
            
            showNotification('Success', 'Task deleted successfully', 'success');
            
            // Refresh the task list if needed
            loadTasks();
        } else {
            console.error('Error deleting task:', data.message);
            showNotification('Error', data.message || 'Could not delete task', 'error');
        }
    } catch (error) {
        console.error('Error deleting task:', error);
        showNotification('Error', 'Could not delete task. Please try again.', 'error');
    }
}

// Create a new task
async function createTask(taskData) {
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create task');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh the task list
            loadTasks();
            return data.task;
        } else {
            console.error('Error creating task:', data.message);
            showNotification('Error', data.message || 'Could not create task', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error creating task:', error);
        showNotification('Error', 'Could not create task. Please try again.', 'error');
        return null;
    }
}

// Refresh the tasks list
function refreshTasks() {
    loadTasks();
}

// Setup event listeners for task operations
function setupTaskEventListeners() {
    // Add task button
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            // Create a modal for adding a new task
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
            modalTitle.textContent = 'Add New Task';
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
            form.id = 'addTaskForm';
            
            // Task title field
            const titleGroup = document.createElement('div');
            titleGroup.className = 'form-group';
            
            const titleLabel = document.createElement('label');
            titleLabel.htmlFor = 'newTaskTitle';
            titleLabel.className = 'form-label';
            titleLabel.textContent = 'Task Title';
            
            const titleInput = document.createElement('input');
            titleInput.type = 'text';
            titleInput.id = 'newTaskTitle';
            titleInput.className = 'form-control';
            titleInput.placeholder = 'Enter task title';
            titleInput.required = true;
            
            titleGroup.appendChild(titleLabel);
            titleGroup.appendChild(titleInput);
            
            // Task description field
            const descGroup = document.createElement('div');
            descGroup.className = 'form-group';
            
            const descLabel = document.createElement('label');
            descLabel.htmlFor = 'newTaskDescription';
            descLabel.className = 'form-label';
            descLabel.textContent = 'Description (optional)';
            
            const descInput = document.createElement('textarea');
            descInput.id = 'newTaskDescription';
            descInput.className = 'form-control';
            descInput.placeholder = 'Enter task description';
            descInput.rows = 3;
            
            descGroup.appendChild(descLabel);
            descGroup.appendChild(descInput);
            
            // Task deadline field
            const deadlineGroup = document.createElement('div');
            deadlineGroup.className = 'form-group';
            
            const deadlineLabel = document.createElement('label');
            deadlineLabel.htmlFor = 'newTaskDeadline';
            deadlineLabel.className = 'form-label';
            deadlineLabel.textContent = 'Deadline (optional)';
            
            const deadlineInput = document.createElement('input');
            deadlineInput.type = 'datetime-local';
            deadlineInput.id = 'newTaskDeadline';
            deadlineInput.className = 'form-control';
            
            deadlineGroup.appendChild(deadlineLabel);
            deadlineGroup.appendChild(deadlineInput);
            
            // Add all form groups to the form
            form.appendChild(titleGroup);
            form.appendChild(descGroup);
            form.appendChild(deadlineGroup);
            
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
            saveButton.textContent = 'Add Task';
            saveButton.addEventListener('click', async () => {
                // Get form values
                const newTask = {
                    title: titleInput.value.trim(),
                    description: descInput.value.trim()
                };
                
                // Add deadline if provided
                if (deadlineInput.value) {
                    newTask.deadline = new Date(deadlineInput.value).toISOString();
                }
                
                // Validate form
                if (!newTask.title) {
                    showNotification('Error', 'Task title is required', 'error');
                    return;
                }
                
                // Create the task
                const createdTask = await createTask(newTask);
                
                if (createdTask) {
                    showNotification('Success', 'Task created successfully', 'success');
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
