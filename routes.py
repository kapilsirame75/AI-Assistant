import json
import os
from datetime import datetime
from flask import render_template, redirect, url_for, request, flash, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename
import io
import tempfile

from app import app, db
from models import User, Task, Reminder, FileUpload
from utils.nlp_processor import process_natural_language_command, answer_question
from utils.datetime_parser import parse_datetime_from_text
from utils.external_apis import get_weather_data, get_news_data

@app.route('/')
def index():
    if current_user.is_authenticated:
        return render_template('index.html', now=datetime.now())
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            flash('Invalid username or password')
            return redirect(url_for('login'))
        
        login_user(user, remember=True)
        return redirect(url_for('index'))
    
    return render_template('login.html', now=datetime.now())

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('Username already taken')
            return redirect(url_for('register'))
        
        if User.query.filter_by(email=email).first():
            flash('Email already registered')
            return redirect(url_for('register'))
        
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful! Please log in.')
        return redirect(url_for('login'))
    
    return render_template('register.html', now=datetime.now())

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# API ROUTES

@app.route('/api/process-command', methods=['POST'])
@login_required
def process_command():
    data = request.get_json()
    if not data or 'command' not in data:
        return jsonify({'error': 'No command provided'}), 400
    
    command = data['command']
    result = process_natural_language_command(command)
    
    if result['intent'] == 'add_task':
        # Add a new task
        task = Task(
            title=result['title'],
            description=result.get('description', ''),
            deadline=parse_datetime_from_text(result.get('deadline', '')),
            user_id=current_user.id
        )
        db.session.add(task)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Task added successfully',
            'task': task.to_dict()
        })
    
    elif result['intent'] == 'add_reminder':
        # Add a new reminder
        reminder_time = parse_datetime_from_text(result.get('time', ''))
        if not reminder_time:
            return jsonify({'error': 'Could not parse reminder time'}), 400
        
        reminder = Reminder(
            title=result['title'],
            description=result.get('description', ''),
            reminder_time=reminder_time,
            user_id=current_user.id
        )
        db.session.add(reminder)
        db.session.commit()
        return jsonify({
            'success': True,
            'message': 'Reminder set successfully',
            'reminder': reminder.to_dict()
        })
    
    elif result['intent'] == 'question':
        # Process a general question
        answer = answer_question(command)
        return jsonify({
            'success': True,
            'message': 'Question answered',
            'answer': answer
        })
    
    elif result['intent'] == 'weather':
        # Fetch weather data
        location = result.get('location', 'New York')
        weather_data = get_weather_data(location)
        return jsonify({
            'success': True,
            'message': 'Weather retrieved',
            'weather': weather_data
        })
    
    elif result['intent'] == 'news':
        # Fetch news data
        topic = result.get('topic', 'general')
        news_data = get_news_data(topic)
        return jsonify({
            'success': True,
            'message': 'News retrieved',
            'news': news_data
        })
    
    else:
        return jsonify({
            'success': False,
            'message': 'I didn\'t understand that command'
        })

@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'success': True,
        'tasks': [task.to_dict() for task in tasks]
    })

@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    data = request.get_json()
    
    if not data or 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    deadline = None
    if 'deadline' in data and data['deadline']:
        try:
            deadline = datetime.fromisoformat(data['deadline'])
        except ValueError:
            return jsonify({'error': 'Invalid deadline format'}), 400
    
    task = Task(
        title=data['title'],
        description=data.get('description', ''),
        deadline=deadline,
        completed=data.get('completed', False),
        user_id=current_user.id
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Task created successfully',
        'task': task.to_dict()
    })

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    if 'title' in data:
        task.title = data['title']
    
    if 'description' in data:
        task.description = data['description']
    
    if 'deadline' in data:
        if data['deadline']:
            try:
                task.deadline = datetime.fromisoformat(data['deadline'])
            except ValueError:
                return jsonify({'error': 'Invalid deadline format'}), 400
        else:
            task.deadline = None
    
    if 'completed' in data:
        task.completed = bool(data['completed'])
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Task updated successfully',
        'task': task.to_dict()
    })

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Task deleted successfully'
    })

@app.route('/api/reminders', methods=['GET'])
@login_required
def get_reminders():
    reminders = Reminder.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'success': True,
        'reminders': [reminder.to_dict() for reminder in reminders]
    })

@app.route('/api/reminders', methods=['POST'])
@login_required
def create_reminder():
    data = request.get_json()
    
    if not data or 'title' not in data or 'reminder_time' not in data:
        return jsonify({'error': 'Title and reminder time are required'}), 400
    
    try:
        reminder_time = datetime.fromisoformat(data['reminder_time'])
    except ValueError:
        return jsonify({'error': 'Invalid reminder time format'}), 400
    
    reminder = Reminder(
        title=data['title'],
        description=data.get('description', ''),
        reminder_time=reminder_time,
        user_id=current_user.id
    )
    
    db.session.add(reminder)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Reminder created successfully',
        'reminder': reminder.to_dict()
    })

@app.route('/api/reminders/<int:reminder_id>', methods=['DELETE'])
@login_required
def delete_reminder(reminder_id):
    reminder = Reminder.query.filter_by(id=reminder_id, user_id=current_user.id).first()
    
    if not reminder:
        return jsonify({'error': 'Reminder not found'}), 404
    
    db.session.delete(reminder)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Reminder deleted successfully'
    })

@app.route('/api/weather', methods=['GET'])
@login_required
def fetch_weather():
    location = request.args.get('location', 'New York')
    weather_data = get_weather_data(location)
    return jsonify({
        'success': True,
        'location': location,
        'weather': weather_data
    })

@app.route('/api/news', methods=['GET'])
@login_required
def fetch_news():
    topic = request.args.get('topic', 'general')
    news_data = get_news_data(topic)
    return jsonify({
        'success': True,
        'topic': topic,
        'news': news_data
    })

@app.route('/api/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        content_type = file.content_type
        
        # Extract text content from file
        text_content = ''
        if content_type == 'text/plain':
            text_content = file.read().decode('utf-8')
            file.seek(0)  # Reset file pointer
        elif content_type == 'application/pdf':
            # In a real app, we'd use PyMuPDF or similar to extract text
            # For now, we'll just store a placeholder message
            text_content = "PDF content extracted (simulated)"
        
        # Create a temporary file for processing if needed
        with tempfile.NamedTemporaryFile(delete=False) as temp:
            file.save(temp.name)
            
            # Process the file as needed
            # In a real implementation, this would involve file parsing
            
            # Store file metadata in the database
            file_upload = FileUpload(
                filename=filename,
                content_type=content_type,
                text_content=text_content,
                user_id=current_user.id
            )
            
            db.session.add(file_upload)
            db.session.commit()
            
            # Clean up the temporary file
            os.unlink(temp.name)
        
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'file_id': file_upload.id,
            'filename': filename
        })

@app.route('/api/files', methods=['GET'])
@login_required
def get_files():
    files = FileUpload.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        'success': True,
        'files': [{
            'id': f.id,
            'filename': f.filename,
            'content_type': f.content_type,
            'uploaded_at': f.uploaded_at.isoformat()
        } for f in files]
    })

@app.route('/api/files/<int:file_id>/query', methods=['POST'])
@login_required
def query_file(file_id):
    file_upload = FileUpload.query.filter_by(id=file_id, user_id=current_user.id).first()
    
    if not file_upload:
        return jsonify({'error': 'File not found'}), 404
    
    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({'error': 'No query provided'}), 400
    
    query = data['query']
    
    # In a real implementation, we would process the query against the file content
    # using NLP techniques. For now, we'll return a placeholder response.
    response = f"This is a simulated response to your query: '{query}' about the file: '{file_upload.filename}'"
    
    return jsonify({
        'success': True,
        'query': query,
        'response': response
    })
