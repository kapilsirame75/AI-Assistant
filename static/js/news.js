// News functionality

// Initialize the news module
function initNews() {
    // Load news on page load
    loadNews();
    
    // Setup event listeners
    setupNewsEventListeners();
}

// Load news from the API
async function loadNews(topic = 'general') {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;
    
    try {
        // Show loading state
        newsContainer.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Loading news...</div>';
        
        const response = await fetch(`/api/news?topic=${encodeURIComponent(topic)}`);
        if (!response.ok) {
            throw new Error('Failed to load news');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Render news
            renderNews(data.news, topic);
        } else {
            console.error('Error loading news:', data.message);
            newsContainer.innerHTML = '<div class="alert alert-danger">Failed to load news. Please try again later.</div>';
        }
    } catch (error) {
        console.error('Error loading news:', error);
        newsContainer.innerHTML = '<div class="alert alert-danger">Failed to load news. Please try again later.</div>';
    }
}

// Render news articles
function renderNews(articles, topic) {
    const newsContainer = document.getElementById('newsContainer');
    if (!newsContainer) return;
    
    // Clear existing content
    newsContainer.innerHTML = '';
    
    // Create news header
    const newsHeader = document.createElement('div');
    newsHeader.className = 'card-header';
    newsHeader.innerHTML = `
        <h5 class="card-title mb-0">Latest ${topic.charAt(0).toUpperCase() + topic.slice(1)} News</h5>
    `;
    
    // Create news list
    const newsList = document.createElement('ul');
    newsList.className = 'news-list';
    
    if (articles.length === 0) {
        newsList.innerHTML = '<div class="p-3 text-center text-muted">No news articles available</div>';
    } else {
        // Add each article to the list
        articles.forEach(article => {
            const newsItem = document.createElement('li');
            newsItem.className = 'news-item';
            
            newsItem.innerHTML = `
                <div class="news-title">
                    <a href="${article.url}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(article.title)}
                    </a>
                </div>
                <div class="news-description">${escapeHtml(article.description || '')}</div>
                <div class="news-meta">${formatDate(article.publishedAt)}</div>
            `;
            
            newsList.appendChild(newsItem);
        });
    }
    
    // Add topic selector
    const topicSelector = document.createElement('div');
    topicSelector.className = 'card-footer';
    
    const topics = ['general', 'technology', 'business', 'health', 'science', 'sports', 'entertainment'];
    
    topicSelector.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">Select topic:</small>
            <div class="topic-buttons">
                ${topics.map(t => `
                    <button class="btn btn-sm ${t === topic ? 'btn-primary' : 'btn-outline'} mr-1" 
                    data-topic="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</button>
                `).join('')}
            </div>
        </div>
    `;
    
    // Add components to container
    newsContainer.appendChild(newsHeader);
    newsContainer.appendChild(newsList);
    newsContainer.appendChild(topicSelector);
    
    // Add event listeners to topic buttons
    const topicButtons = topicSelector.querySelectorAll('[data-topic]');
    topicButtons.forEach(button => {
        button.addEventListener('click', function() {
            const selectedTopic = this.dataset.topic;
            loadNews(selectedTopic);
        });
    });
}

// Setup event listeners for news functionality
function setupNewsEventListeners() {
    // Refresh news button
    const refreshNewsBtn = document.getElementById('refreshNewsBtn');
    if (refreshNewsBtn) {
        refreshNewsBtn.addEventListener('click', () => {
            loadNews();
        });
    }
}

// Refresh news with new data
function refreshNews(newsData, topic = 'general') {
    if (newsData) {
        renderNews(newsData, topic);
    } else {
        loadNews(topic);
    }
}
