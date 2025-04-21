# WebDevToolkit

## Overview
WebDevToolkit is a Flask-based web application designed to streamline web development tasks. It provides a modular structure for building scalable and maintainable web applications.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Setup Instructions](#setup-instructions)
  - [Prerequisites](#prerequisites)
  - [Clone the Repository](#clone-the-repository)
  - [Create and Activate a Virtual Environment](#create-and-activate-a-virtual-environment)
  - [Install Dependencies](#install-dependencies)
  - [Run the Application](#run-the-application)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Common Commands](#common-commands)
- [Debugging](#debugging)

## Features
- Modular Flask application structure.
- Easy-to-extend routing system.
- Debug mode for efficient development.

## Setup Instructions

### Prerequisites
Ensure the following are installed on your system:
- Python 3.7 or higher
- pip (Python package manager)
- Virtual environment tools (optional but recommended)

### Clone the Repository
Clone the repository and navigate to the project directory:
```bash
git clone <repository-url>
cd WebDevToolkit
```

### Create and Activate a Virtual Environment
(Optional but recommended) Create and activate a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Install Dependencies
Install the required dependencies:
```bash
pip install flask
```

### Run the Application
Start the Flask application:
```bash
python main.py
```

## Environment Variables
If the project requires environment variables (e.g., for database connections or API keys), create a `.env` file in the root directory and define them there. Use the `python-dotenv` package to load these variables into the application.

## Project Structure
The project structure is as follows:
```
WebDevToolkit/
├── app/
│   ├── __init__.py
│   └── ... (other Flask app files)
├── routes.py
├── main.py
└── requirements.txt
```

## Common Commands
- **Install dependencies**: `pip install -r requirements.txt`
- **Run the app**: `python main.py`
- **Deactivate virtual environment**: `deactivate`

## Debugging
Enable `debug=True` in `app.run()` for live reloading and detailed error messages during development.
