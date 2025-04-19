// Weather functionality

// Initialize the weather module
function initWeather() {
    // Load weather on page load
    loadWeather();
    
    // Setup event listeners
    setupWeatherEventListeners();
}

// Load weather from the API
async function loadWeather(location = '') {
    const weatherContainer = document.getElementById('weatherContainer');
    if (!weatherContainer) return;
    
    try {
        // Show loading state
        weatherContainer.innerHTML = '<div class="text-center p-3"><i class="fas fa-spinner fa-spin"></i> Loading weather...</div>';
        
        // Use the provided location or default to empty (which will use user's location on server-side)
        const queryParams = location ? `?location=${encodeURIComponent(location)}` : '';
        const response = await fetch(`/api/weather${queryParams}`);
        
        if (!response.ok) {
            throw new Error('Failed to load weather');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Render weather data
            renderWeather(data.weather, data.location);
        } else {
            console.error('Error loading weather:', data.message);
            weatherContainer.innerHTML = '<div class="alert alert-danger">Failed to load weather. Please try again later.</div>';
        }
    } catch (error) {
        console.error('Error loading weather:', error);
        weatherContainer.innerHTML = '<div class="alert alert-danger">Failed to load weather. Please try again later.</div>';
    }
}

// Render weather data
function renderWeather(weather, location) {
    const weatherContainer = document.getElementById('weatherContainer');
    if (!weatherContainer) return;
    
    // Get weather icon based on condition
    const weatherIcon = getWeatherIcon(weather.condition);
    
    // Format the weather card
    weatherContainer.innerHTML = `
        <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Weather</h5>
            <button id="refreshWeatherBtn" class="btn btn-sm btn-outline" title="Refresh weather">
                <i class="fas fa-sync-alt"></i>
            </button>
        </div>
        <div class="weather-widget">
            <div class="weather-info">
                <div class="weather-location">${escapeHtml(weather.location)}</div>
                <div class="weather-temp">${weather.temperature_c}°C / ${weather.temperature_f}°F</div>
                <div class="weather-condition">${escapeHtml(weather.condition)}</div>
                <div class="weather-details mt-2">
                    <small class="d-block">Humidity: ${weather.humidity}%</small>
                    <small class="d-block">Wind: ${weather.wind_speed} km/h ${weather.wind_direction}</small>
                </div>
            </div>
            <div class="weather-icon">
                ${weatherIcon}
            </div>
        </div>
        <div class="card-footer">
            <div class="weather-search">
                <div class="input-group">
                    <input type="text" id="locationInput" class="form-control" placeholder="Enter location">
                    <div class="input-group-append">
                        <button id="searchLocationBtn" class="btn btn-primary">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add forecast section if available
    if (weather.forecast && weather.forecast.length > 0) {
        const forecastSection = document.createElement('div');
        forecastSection.className = 'forecast-section p-3 border-top';
        
        // Create forecast header
        const forecastHeader = document.createElement('h6');
        forecastHeader.className = 'mb-2';
        forecastHeader.textContent = 'Forecast';
        
        // Create forecast items
        const forecastItems = document.createElement('div');
        forecastItems.className = 'd-flex justify-content-between';
        
        weather.forecast.forEach(day => {
            const dayIcon = getWeatherIcon(day.condition, 'sm');
            const forecastDay = document.createElement('div');
            forecastDay.className = 'text-center';
            forecastDay.innerHTML = `
                <div class="forecast-date">${formatForecastDate(day.date)}</div>
                <div class="forecast-icon">${dayIcon}</div>
                <div class="forecast-temp">${day.max_temp_c}° / ${day.min_temp_c}°</div>
                <div class="forecast-rain text-muted"><small>${day.chance_of_rain}% 💧</small></div>
            `;
            forecastItems.appendChild(forecastDay);
        });
        
        forecastSection.appendChild(forecastHeader);
        forecastSection.appendChild(forecastItems);
        weatherContainer.appendChild(forecastSection);
    }
    
    // Setup event listeners for weather actions
    const refreshBtn = document.getElementById('refreshWeatherBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => loadWeather(location));
    }
    
    const searchBtn = document.getElementById('searchLocationBtn');
    const locationInput = document.getElementById('locationInput');
    
    if (searchBtn && locationInput) {
        searchBtn.addEventListener('click', () => {
            const newLocation = locationInput.value.trim();
            if (newLocation) {
                loadWeather(newLocation);
            }
        });
        
        // Allow pressing Enter to search
        locationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const newLocation = locationInput.value.trim();
                if (newLocation) {
                    loadWeather(newLocation);
                }
            }
        });
    }
}

// Get weather icon based on condition
function getWeatherIcon(condition, size = 'lg') {
    condition = condition.toLowerCase();
    let icon = '';
    
    // Set icon size class
    const iconSize = size === 'sm' ? 'fa-lg' : 'fa-3x';
    
    // Map condition to Font Awesome icons
    if (condition.includes('sun') || condition.includes('clear')) {
        icon = `<i class="fas fa-sun ${iconSize} text-warning"></i>`;
    } else if (condition.includes('cloud') && condition.includes('sun')) {
        icon = `<i class="fas fa-cloud-sun ${iconSize} text-warning"></i>`;
    } else if (condition.includes('cloud')) {
        icon = `<i class="fas fa-cloud ${iconSize} text-secondary"></i>`;
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
        icon = `<i class="fas fa-cloud-rain ${iconSize} text-primary"></i>`;
    } else if (condition.includes('thunder') || condition.includes('storm')) {
        icon = `<i class="fas fa-bolt ${iconSize} text-warning"></i>`;
    } else if (condition.includes('snow')) {
        icon = `<i class="fas fa-snowflake ${iconSize} text-info"></i>`;
    } else if (condition.includes('fog') || condition.includes('mist')) {
        icon = `<i class="fas fa-smog ${iconSize} text-secondary"></i>`;
    } else {
        // Default weather icon
        icon = `<i class="fas fa-cloud ${iconSize} text-secondary"></i>`;
    }
    
    return icon;
}

// Format date for forecast display
function formatForecastDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    
    // Check if the date is today or tomorrow
    if (date.toDateString() === now.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        // Return day name for other days
        return date.toLocaleDateString(undefined, { weekday: 'short' });
    }
}

// Setup event listeners for weather functionality
function setupWeatherEventListeners() {
    // Already handled in renderWeather function
}

// Refresh weather with new data
function refreshWeather(weatherData, location) {
    if (weatherData) {
        renderWeather(weatherData, location);
    } else {
        loadWeather();
    }
}
