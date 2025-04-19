from datetime import datetime, timedelta
import re

def parse_datetime_from_text(text):
    """
    Parse a datetime from natural language text
    
    Args:
        text (str): The text containing a date/time reference
        
    Returns:
        datetime: A datetime object, or None if parsing fails
    """
    if not text:
        return None
    
    text = text.lower()
    now = datetime.now()
    
    # Handle relative time expressions
    if "now" in text:
        return now
    
    if "today" in text:
        # Default to end of day if only "today" is specified
        return datetime(now.year, now.month, now.day, 23, 59, 59)
    
    if "tomorrow" in text:
        tomorrow = now + timedelta(days=1)
        # Default to end of day
        return datetime(tomorrow.year, tomorrow.month, tomorrow.day, 23, 59, 59)
    
    # Handle "in X minutes/hours/days/weeks"
    in_pattern = r"in (\d+) (minute|minutes|hour|hours|day|days|week|weeks)"
    in_match = re.search(in_pattern, text)
    if in_match:
        amount = int(in_match.group(1))
        unit = in_match.group(2)
        
        if unit in ["minute", "minutes"]:
            return now + timedelta(minutes=amount)
        elif unit in ["hour", "hours"]:
            return now + timedelta(hours=amount)
        elif unit in ["day", "days"]:
            return now + timedelta(days=amount)
        elif unit in ["week", "weeks"]:
            return now + timedelta(weeks=amount)
    
    # Handle day of week
    days_of_week = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6
    }
    
    for day, day_num in days_of_week.items():
        if day in text:
            # Calculate days until the next occurrence of this day
            days_ahead = day_num - now.weekday()
            if days_ahead <= 0:  # Target day already happened this week
                days_ahead += 7
                
            target_date = now + timedelta(days=days_ahead)
            # Default to 9 AM if no time is specified
            return datetime(target_date.year, target_date.month, target_date.day, 9, 0, 0)
    
    # Handle time expressions like "at 3 PM" or "at 15:00"
    time_patterns = [
        r"at (\d+)(?::(\d+))?\s*(am|pm)?",  # "at 3 PM" or "at 3:30 PM"
        r"(\d+)(?::(\d+))?\s*(am|pm)"       # "3 PM" or "3:30 PM"
    ]
    
    for pattern in time_patterns:
        time_match = re.search(pattern, text)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2)) if time_match.group(2) else 0
            am_pm = time_match.group(3)
            
            # Adjust hour for PM
            if am_pm and am_pm.lower() == 'pm' and hour < 12:
                hour += 12
            
            # Adjust hour for AM
            if am_pm and am_pm.lower() == 'am' and hour == 12:
                hour = 0
                
            return datetime(now.year, now.month, now.day, hour, minute, 0)
    
    # Handle date expressions like "May 15" or "15th May"
    months = {
        "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
        "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "jun": 6, "jul": 7, "aug": 8, 
        "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12
    }
    
    # Pattern for "Month day" format (e.g., "May 15")
    month_day_pattern = r"(\w+)\s+(\d+)(?:st|nd|rd|th)?"
    month_day_match = re.search(month_day_pattern, text)
    
    if month_day_match:
        month_name = month_day_match.group(1).lower()
        day = int(month_day_match.group(2))
        
        if month_name in months:
            month = months[month_name]
            year = now.year
            
            # If the date has already passed this year, assume next year
            if month < now.month or (month == now.month and day < now.day):
                year += 1
                
            try:
                return datetime(year, month, day, 9, 0, 0)  # Default to 9 AM
            except ValueError:
                # Invalid date (e.g., February 30)
                return None
    
    # Pattern for "day Month" format (e.g., "15th May")
    day_month_pattern = r"(\d+)(?:st|nd|rd|th)?\s+(\w+)"
    day_month_match = re.search(day_month_pattern, text)
    
    if day_month_match:
        day = int(day_month_match.group(1))
        month_name = day_month_match.group(2).lower()
        
        if month_name in months:
            month = months[month_name]
            year = now.year
            
            # If the date has already passed this year, assume next year
            if month < now.month or (month == now.month and day < now.day):
                year += 1
                
            try:
                return datetime(year, month, day, 9, 0, 0)  # Default to 9 AM
            except ValueError:
                # Invalid date (e.g., February 30)
                return None
    
    # If all parsing attempts fail, return None
    return None
