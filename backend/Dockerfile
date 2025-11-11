# ใช้ Python base image
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Copy project
COPY . /app

# ติดตั้ง dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt