// File processor functionality

// Initialize the file processor module
function initFileUpload() {
    // Setup file upload area
    setupFileUpload();
    
    // Load existing files
    loadFiles();
}

// Setup file upload area
function setupFileUpload() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileUploadInput = document.getElementById('fileUploadInput');
    
    if (!fileUploadArea || !fileUploadInput) return;
    
    // Handle click on upload area
    fileUploadArea.addEventListener('click', () => {
        fileUploadInput.click();
    });
    
    // Handle file selection
    fileUploadInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
        }
    });
    
    // Handle drag and drop
    fileUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadArea.classList.add('border-primary');
    });
    
    fileUploadArea.addEventListener('dragleave', () => {
        fileUploadArea.classList.remove('border-primary');
    });
    
    fileUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadArea.classList.remove('border-primary');
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            uploadFile(e.dataTransfer.files[0]);
        }
    });
}

// Upload a file to the server
async function uploadFile(file) {
    try {
        // Only allow text and PDF files
        if (file.type !== 'text/plain' && file.type !== 'application/pdf') {
            showNotification('Error', 'Only text and PDF files are supported', 'error');
            return;
        }
        
        // Show loading state
        const fileUploadArea = document.getElementById('fileUploadArea');
        if (fileUploadArea) {
            const originalContent = fileUploadArea.innerHTML;
            fileUploadArea.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Uploading...</div>';
        }
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload the file
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        // Reset upload area
        if (fileUploadArea) {
            fileUploadArea.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-file-upload fa-2x mb-2"></i>
                    <p class="mb-0">Drag and drop a file here, or click to select</p>
                    <p class="text-muted"><small>Supported formats: TXT, PDF</small></p>
                </div>
            `;
        }
        
        if (!response.ok) {
            throw new Error('File upload failed');
        }
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Success', 'File uploaded successfully', 'success');
            // Refresh the file list
            loadFiles();
        } else {
            console.error('Error uploading file:', data.message);
            showNotification('Error', data.message || 'File upload failed', 'error');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showNotification('Error', 'File upload failed. Please try again.', 'error');
        
        // Reset upload area if there was an error
        const fileUploadArea = document.getElementById('fileUploadArea');
        if (fileUploadArea) {
            fileUploadArea.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-file-upload fa-2x mb-2"></i>
                    <p class="mb-0">Drag and drop a file here, or click to select</p>
                    <p class="text-muted"><small>Supported formats: TXT, PDF</small></p>
                </div>
            `;
        }
    }
}

// Load files from the server
async function loadFiles() {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    try {
        const response = await fetch('/api/files');
        if (!response.ok) {
            throw new Error('Failed to load files');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Render files
            renderFiles(data.files);
        } else {
            console.error('Error loading files:', data.message);
            fileList.innerHTML = '<div class="alert alert-danger">Failed to load files. Please try again later.</div>';
        }
    } catch (error) {
        console.error('Error loading files:', error);
        fileList.innerHTML = '<div class="alert alert-danger">Failed to load files. Please try again later.</div>';
    }
}

// Render files in the file list
function renderFiles(files) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    
    // Clear existing files
    fileList.innerHTML = '';
    
    if (files.length === 0) {
        fileList.innerHTML = '<div class="p-3 text-center text-muted">No files uploaded yet</div>';
        return;
    }
    
    // Create list of files
    const ul = document.createElement('ul');
    ul.className = 'file-list';
    
    files.forEach(file => {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.dataset.id = file.id;
        
        // Get icon based on file type
        let fileIcon = 'fa-file-alt';
        if (file.content_type === 'application/pdf') {
            fileIcon = 'fa-file-pdf';
        }
        
        li.innerHTML = `
            <span class="file-name">
                <i class="fas ${fileIcon} mr-2"></i>
                ${escapeHtml(file.filename)}
            </span>
            <span class="file-date text-muted">
                <small>${formatDate(file.uploaded_at)}</small>
            </span>
            <div class="file-actions">
                <button class="btn btn-sm btn-outline query-file-btn" title="Ask about this file">
                    <i class="fas fa-question-circle"></i>
                </button>
            </div>
        `;
        
        // Add event listener for query button
        const queryBtn = li.querySelector('.query-file-btn');
        if (queryBtn) {
            queryBtn.addEventListener('click', () => {
                showFileQueryModal(file);
            });
        }
        
        ul.appendChild(li);
    });
    
    fileList.appendChild(ul);
}

// Show modal for querying a file
function showFileQueryModal(file) {
    // Create a modal for querying the file
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
    modalTitle.textContent = `Ask about "${file.filename}"`;
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
    form.id = 'fileQueryForm';
    
    // Query input field
    const queryGroup = document.createElement('div');
    queryGroup.className = 'form-group';
    
    const queryLabel = document.createElement('label');
    queryLabel.htmlFor = 'fileQuery';
    queryLabel.className = 'form-label';
    queryLabel.textContent = 'What would you like to know about this file?';
    
    const queryInput = document.createElement('textarea');
    queryInput.id = 'fileQuery';
    queryInput.className = 'form-control';
    queryInput.placeholder = 'e.g., "Summarize this document" or "What are the main points?"';
    queryInput.rows = 3;
    queryInput.required = true;
    
    queryGroup.appendChild(queryLabel);
    queryGroup.appendChild(queryInput);
    
    // Add quick suggestion buttons
    const suggestionsGroup = document.createElement('div');
    suggestionsGroup.className = 'form-group';
    
    const suggestionsLabel = document.createElement('div');
    suggestionsLabel.className = 'form-label';
    suggestionsLabel.textContent = 'Quick suggestions:';
    
    const suggestions = [
        'Summarize this document',
        'What are the key points?',
        'Extract important dates',
        'Find contact information',
        'Explain technical terms'
    ];
    
    const suggestionsButtons = document.createElement('div');
    suggestionsButtons.className = 'd-flex flex-wrap gap-2';
    suggestionsButtons.style.gap = 'var(--spacing-xs)';
    
    suggestions.forEach(suggestion => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline mb-1';
        button.textContent = suggestion;
        button.addEventListener('click', () => {
            queryInput.value = suggestion;
        });
        
        suggestionsButtons.appendChild(button);
    });
    
    suggestionsGroup.appendChild(suggestionsLabel);
    suggestionsGroup.appendChild(suggestionsButtons);
    
    // Response area (initially hidden)
    const responseArea = document.createElement('div');
    responseArea.id = 'queryResponseArea';
    responseArea.className = 'mt-3 p-3 bg-light rounded';
    responseArea.style.display = 'none';
    
    // Add form components
    form.appendChild(queryGroup);
    form.appendChild(suggestionsGroup);
    
    modalBody.appendChild(form);
    modalBody.appendChild(responseArea);
    
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
    cancelButton.textContent = 'Close';
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    const askButton = document.createElement('button');
    askButton.type = 'button';
    askButton.className = 'btn btn-primary';
    askButton.textContent = 'Ask';
    askButton.addEventListener('click', async () => {
        const query = queryInput.value.trim();
        
        if (!query) {
            showNotification('Error', 'Please enter a question', 'error');
            return;
        }
        
        // Show loading state
        responseArea.style.display = 'block';
        responseArea.innerHTML = '<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Processing your question...</div>';
        askButton.disabled = true;
        
        try {
            // Send query to server
            const response = await fetch(`/api/files/${file.id}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });
            
            if (!response.ok) {
                throw new Error('Failed to process query');
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Display the response
                responseArea.innerHTML = `
                    <h5>Response:</h5>
                    <p>${escapeHtml(data.response)}</p>
                `;
            } else {
                responseArea.innerHTML = `
                    <div class="alert alert-danger">
                        ${escapeHtml(data.error || 'Failed to process query. Please try again.')}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error querying file:', error);
            responseArea.innerHTML = `
                <div class="alert alert-danger">
                    Failed to process query. Please try again.
                </div>
            `;
        } finally {
            askButton.disabled = false;
        }
    });
    
    modalFooter.appendChild(cancelButton);
    modalFooter.appendChild(askButton);
    
    // Assemble the modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalContainer.appendChild(modalContent);
    
    // Add modal to the document
    document.body.appendChild(modalContainer);
    
    // Focus the query input
    queryInput.focus();
}
