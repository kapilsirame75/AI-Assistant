import re
import random
from datetime import datetime, timedelta

def process_natural_language_command(command):
    """
    Process a natural language command and determine the intent
    
    Args:
        command (str): The user's natural language command
        
    Returns:
        dict: A dictionary with the intent and extracted information
    """
    command = command.lower().strip()
    
    # Task-related commands
    task_patterns = [
        r"add (?:a )?task(?: to)?(?: do)?(?: called)? (.+)",
        r"create (?:a )?task(?: called)? (.+)",
        r"(?:i need to|remind me to) (.+)"
    ]
    
    for pattern in task_patterns:
        task_match = re.search(pattern, command)
        if task_match:
            task_title = task_match.group(1).strip()
            
            # Try to extract deadline if present
            deadline = None
            deadline_patterns = [
                r"(?:by|due|on|at) (\w+ \d+(?:st|nd|rd|th)?)",
                r"(?:by|due|on|at) (\d+(?:st|nd|rd|th)? \w+)",
                r"(?:by|due|on|at) (\w+day)",
                r"(?:by|due|on|at) (\d+:\d+)"
            ]
            
            for d_pattern in deadline_patterns:
                deadline_match = re.search(d_pattern, command)
                if deadline_match:
                    deadline = deadline_match.group(1)
                    # Remove the deadline part from the title
                    task_title = re.sub(d_pattern, "", task_title).strip()
                    break
            
            return {
                'intent': 'add_task',
                'title': task_title,
                'deadline': deadline
            }
    
    # Reminder-related commands
    reminder_patterns = [
        r"remind me (?:to|about) (.+?) (?:at|on) (.+)",
        r"set (?:a )?reminder (?:to|for) (.+?) (?:at|on) (.+)",
        r"remind me (.+?) (?:at|on) (.+)"
    ]
    
    for pattern in reminder_patterns:
        reminder_match = re.search(pattern, command)
        if reminder_match:
            return {
                'intent': 'add_reminder',
                'title': reminder_match.group(1).strip(),
                'time': reminder_match.group(2).strip()
            }
    
    # Weather-related commands
    weather_patterns = [
        r"(?:what's|what is|how's|how is) the weather(?: like)?(?: in (.+))?",
        r"weather(?: for| in)? (.+)",
        r"(?:get|show|tell me)(?: the)? weather(?: for| in)? (.+)"
    ]
    
    for pattern in weather_patterns:
        weather_match = re.search(pattern, command)
        if weather_match:
            location = weather_match.group(1) if weather_match.groups() and weather_match.group(1) else "current location"
            return {
                'intent': 'weather',
                'location': location.strip()
            }
    
    # News-related commands
    news_patterns = [
        r"(?:what's|what is) (?:the )?news(?: about| on)? (.+)?",
        r"(?:show|get|tell me)(?: the)? news(?: about| on)? (.+)?",
        r"(?:latest|recent) news(?: about| on)? (.+)?"
    ]
    
    for pattern in news_patterns:
        news_match = re.search(pattern, command)
        if news_match:
            topic = news_match.group(1) if news_match.groups() and news_match.group(1) else "general"
            return {
                'intent': 'news',
                'topic': topic.strip()
            }
    
    # Question answering
    question_starters = ["what", "how", "why", "when", "where", "who", "can you", "tell me", "is", "are", "do", "does"]
    if any(command.startswith(starter) for starter in question_starters):
        return {
            'intent': 'question',
            'query': command
        }
    
    # Default fallback
    return {
        'intent': 'unknown',
        'original_command': command
    }

def answer_question(question):
    """
    Answer a natural language question
    
    Args:
        question (str): The user's question
        
    Returns:
        str: The answer to the question
    """
    question = question.lower()
    
    # Time-related questions
    if re.search(r"what (?:time|day|date) is it", question):
        now = datetime.now()
        return f"It's {now.strftime('%I:%M %p')} on {now.strftime('%A, %B %d, %Y')}."
    
    # Simple factual questions (would be handled by a real NLP model)
    knowledge_base = {
        "who are you": "I'm your AI-powered personal assistant. I can help you manage tasks, set reminders, answer questions, and more.",
        "what can you do": "I can help with tasks, reminders, answer questions, check the weather, get news updates, and process files for information.",
        "how do you work": "I process your natural language commands to understand your intent, then I take appropriate actions like setting reminders or retrieving information."
    }
    
    for key, value in knowledge_base.items():
        if key in question:
            return value
    
    # Fallback response
    return "I don't have an answer for that question. I'm a basic assistant focused on tasks, reminders, weather, and news."
