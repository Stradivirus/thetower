# Use the official Python image as a base image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED 1
ENV APP_HOME /app

# Create and set the working directory
WORKDIR $APP_HOME

# Copy only requirements first to leverage Docker caching
COPY back/requirements.txt $APP_HOME/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY back/ $APP_HOME/back/

# [FIX START] 작업 디렉토리를 'back' 폴더로 변경
WORKDIR $APP_HOME/back

# Set the command to run uvicorn on main.py inside the new WORKDIR
CMD ["gunicorn", "main:app", "--workers", "5", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
# [FIX END]