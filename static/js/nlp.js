// Natural Language Processing helper functions for the frontend

// Detect the likely intent of a user command
function detectIntent(command) {
    command = command.toLowerCase().trim();
    
    // Common intent patterns
    const taskPatterns = [
        /add (?:a )?task/i,
        /create (?:a )?task/i,
        /need to/i,
        /todo/i,
        /add to (?:my )?list/i
    ];
    
    const reminderPatterns = [
        /remind me/i,
        /reminder/i,
        /don't forget/i,
        /at \d+[:|\.]\d+/i,
        /at \d+ (?:am|pm)/i
    ];
    
    const weatherPatterns = [
        /weather/i,
        /temperature/i,
        /forecast/i,
        /is it (?:hot|cold|raining|snowing)/i,
        /(?:how|what)(?:'s| is) the weather/i
    ];
    
    const newsPatterns = [
        /news/i,
        /headlines/i,
        /what's happening/i,
        /current events/i
    ];
    
    // Check each pattern against the command
    for (const pattern of taskPatterns) {
        if (pattern.test(command)) {
            return 'task';
        }
    }
    
    for (const pattern of reminderPatterns) {
        if (pattern.test(command)) {
            return 'reminder';
        }
    }
    
    for (const pattern of weatherPatterns) {
        if (pattern.test(command)) {
            return 'weather';
        }
    }
    
    for (const pattern of newsPatterns) {
        if (pattern.test(command)) {
            return 'news';
        }
    }
    
    // Check if it's a question
    if (/^(?:what|how|why|when|where|who|can|do|does|is|are)/i.test(command)) {
        return 'question';
    }
    
    // Default to unknown intent
    return 'unknown';
}

// Extract a date/time from a natural language string
function extractDateTime(text) {
    text = text.toLowerCase();
    const now = new Date();
    
    // Check for "today", "tomorrow", "next week", etc.
    if (text.includes('today')) {
        return now;
    }
    
    if (text.includes('tomorrow')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
    }
    
    if (text.includes('next week')) {
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek;
    }
    
    // Check for day of week (e.g., "on Monday")
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < days.length; i++) {
        if (text.includes(days[i])) {
            const targetDay = i;
            const dayDiff = (targetDay + 7 - now.getDay()) % 7;
            const nextOccurrence = new Date(now);
            nextOccurrence.setDate(now.getDate() + (dayDiff === 0 ? 7 : dayDiff));
            return nextOccurrence;
        }
    }
    
    // Check for specific time (e.g., "at 3pm")
    const timePattern = /at (\d+)(?::(\d+))?\s*(am|pm)?/i;
    const timeMatch = text.match(timePattern);
    
    if (timeMatch) {
        const result = new Date(now);
        let hour = parseInt(timeMatch[1], 10);
        const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;
        
        // Adjust hour for AM/PM
        if (ampm === 'pm' && hour < 12) {
            hour += 12;
        } else if (ampm === 'am' && hour === 12) {
            hour = 0;
        }
        
        result.setHours(hour, minute, 0, 0);
        
        // If the time is in the past, move to tomorrow
        if (result < now) {
            result.setDate(result.getDate() + 1);
        }
        
        return result;
    }
    
    // Return null if no date/time could be extracted
    return null;
}

// Provide suggestions based on partial command input
function getSuggestions(partialCommand) {
    const command = partialCommand.toLowerCase().trim();
    
    // Common command templates
    const suggestions = [
        'Add a task to buy groceries tomorrow',
        'Remind me to call mom at 6pm',
        'What\'s the weather like today?',
        'Show me the latest technology news',
        'What time is my next meeting?',
        'Add a task to finish the project by Friday',
        'Remind me to take medicine at 9am',
        'How do I create a reminder?',
        'What can you do?'
    ];
    
    // If the command is empty, return a few general suggestions
    if (!command) {
        return suggestions.slice(0, 4);
    }
    
    // Filter suggestions that match the partial command
    const matchingSuggestions = suggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(command)
    );
    
    // Limit to 3 suggestions
    return matchingSuggestions.slice(0, 3);
}

// Add command auto-completion to an input element
function setupCommandAutocomplete(inputElement) {
    if (!inputElement) return;
    
    // Create suggestions container
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-container';
    suggestionsContainer.style.display = 'none';
    inputElement.parentNode.insertBefore(suggestionsContainer, inputElement.nextSibling);
    
    // Update suggestions as user types
    inputElement.addEventListener('input', function() {
        const partialCommand = this.value;
        const suggestions = getSuggestions(partialCommand);
        
        if (suggestions.length > 0) {
            // Display suggestions
            suggestionsContainer.innerHTML = '';
            suggestionsContainer.style.display = 'block';
            
            suggestions.forEach(suggestion => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = suggestion;
                
                // Fill in suggestion when clicked
                suggestionItem.addEventListener('click', function() {
                    inputElement.value = suggestion;
                    suggestionsContainer.style.display = 'none';
                    inputElement.focus();
                });
                
                suggestionsContainer.appendChild(suggestionItem);
            });
        } else {
            // Hide suggestions if none match
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Hide suggestions when input loses focus
    inputElement.addEventListener('blur', function() {
        // Small delay to allow for clicks on suggestions
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 200);
    });
    
    // Show suggestions when input is focused if there's text
    inputElement.addEventListener('focus', function() {
        if (this.value.trim()) {
            const suggestions = getSuggestions(this.value);
            if (suggestions.length > 0) {
                // Display suggestions
                suggestionsContainer.innerHTML = '';
                suggestionsContainer.style.display = 'block';
                
                suggestions.forEach(suggestion => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.textContent = suggestion;
                    
                    // Fill in suggestion when clicked
                    suggestionItem.addEventListener('click', function() {
                        inputElement.value = suggestion;
                        suggestionsContainer.style.display = 'none';
                        inputElement.focus();
                    });
                    
                    suggestionsContainer.appendChild(suggestionItem);
                });
            }
        }
    });
}

// Initialize autocomplete for command input on page load
document.addEventListener('DOMContentLoaded', function() {
    const commandInput = document.getElementById('commandInput');
    if (commandInput) {
        setupCommandAutocomplete(commandInput);
    }
});
