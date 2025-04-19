import requests
import os
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

def get_weather_data(location):
    """
    Get weather data for a specific location using wttr.in API
    
    Args:
        location (str): The location to get weather for
        
    Returns:
        dict: Weather data for the location
    """
    try:
        url = f"https://wttr.in/{location}?format=j1"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract relevant information
        current_condition = data['current_condition'][0]
        weather = {
            'location': data.get('nearest_area', [{}])[0].get('areaName', [{}])[0].get('value', location),
            'temperature_c': current_condition.get('temp_C'),
            'temperature_f': current_condition.get('temp_F'),
            'condition': current_condition.get('weatherDesc', [{}])[0].get('value', 'Unknown'),
            'humidity': current_condition.get('humidity'),
            'precipitation': current_condition.get('precipMM'),
            'wind_speed': current_condition.get('windspeedKmph'),
            'wind_direction': current_condition.get('winddir16Point'),
            'icon': current_condition.get('weatherIconUrl', [{}])[0].get('value', '')
        }
        
        # Add forecast data
        weather['forecast'] = []
        for day in data.get('weather', [])[:3]:  # Get 3-day forecast
            forecast_day = {
                'date': day.get('date'),
                'max_temp_c': day.get('maxtempC'),
                'min_temp_c': day.get('mintempC'),
                'condition': day.get('hourly', [{}])[4].get('weatherDesc', [{}])[0].get('value', 'Unknown'),
                'chance_of_rain': day.get('hourly', [{}])[4].get('chanceofrain', '0')
            }
            weather['forecast'].append(forecast_day)
        
        return weather
    
    except Exception as e:
        logger.error(f"Error fetching weather data: {str(e)}")
        return {
            'location': location,
            'error': 'Could not retrieve weather data',
            'message': str(e)
        }

def get_news_data(topic='general'):
    """
    Get news data for a specific topic using GNews API
    
    Args:
        topic (str): The topic to get news for
        
    Returns:
        list: News articles for the topic
    """
    try:
        # Use GNews API (no key required for limited usage)
        url = f"https://gnews.io/api/v4/top-headlines?category={topic}&lang=en&max=10&apikey={os.environ.get('GNEWS_API_KEY', '')}"
        
        # If no API key is provided, use a mock response
        if os.environ.get('GNEWS_API_KEY', '') == '':
            # Return a simulated response based on the topic
            current_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            # Basic mock data
            mock_news = {
                'general': [
                    {'title': 'Global Leaders Meet to Discuss Climate Change', 'description': 'World leaders gathered to address urgent climate issues.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'Tech Company Launches New Smart Device', 'description': 'Innovative features promise to change how we interact with technology.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'Scientists Make Breakthrough in Cancer Research', 'description': 'New treatment approach shows promising results in clinical trials.', 'url': '#', 'publishedAt': current_date}
                ],
                'technology': [
                    {'title': 'AI Development Reaches New Milestone', 'description': 'Recent advancements in machine learning are reshaping multiple industries.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'Cybersecurity Concerns Rise with Remote Work', 'description': 'Experts warn about new threats as work-from-home continues.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'New Programming Language Gains Popularity', 'description': 'Developers are switching to this language for its efficiency and flexibility.', 'url': '#', 'publishedAt': current_date}
                ],
                'business': [
                    {'title': 'Stock Market Reaches All-Time High', 'description': 'Investors optimistic about economic recovery and growth.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'Major Merger Announced Between Industry Giants', 'description': 'The deal is expected to reshape the competitive landscape.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'Startup Secures Record Funding Round', 'description': 'Innovative business model attracts significant venture capital.', 'url': '#', 'publishedAt': current_date}
                ],
                'health': [
                    {'title': 'New Study Reveals Benefits of Mediterranean Diet', 'description': 'Research confirms positive effects on heart health and longevity.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'Mental Health Awareness Campaigns Show Impact', 'description': 'More people seeking help as stigma decreases.', 'url': '#', 'publishedAt': current_date},
                    {'title': 'Breakthrough in Vaccine Development', 'description': 'New technology could speed up response to future pandemics.', 'url': '#', 'publishedAt': current_date}
                ]
            }
            
            # Return mock news for the requested topic or general if topic not found
            return mock_news.get(topic.lower(), mock_news['general'])
        
        # Make the actual API request if an API key is provided
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Extract and format articles
        articles = []
        for article in data.get('articles', []):
            articles.append({
                'title': article.get('title'),
                'description': article.get('description'),
                'url': article.get('url'),
                'publishedAt': article.get('publishedAt')
            })
        
        return articles
    
    except Exception as e:
        logger.error(f"Error fetching news data: {str(e)}")
        # Return a minimal fallback response
        return [
            {
                'title': 'News temporarily unavailable',
                'description': f'Could not retrieve news data: {str(e)}',
                'url': '#',
                'publishedAt': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        ]
