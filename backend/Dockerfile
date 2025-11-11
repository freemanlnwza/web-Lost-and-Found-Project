# ใช้ Python base image
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Copy project
COPY . /app

# ติดตั้ง dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# expose port
EXPOSE 8000

# รัน uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
