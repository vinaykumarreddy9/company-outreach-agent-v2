# Use Python 3.11 for stability
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Make start script executable
RUN chmod +x render-start.sh

# Expose the API port
EXPOSE 8080

# Environment variable for the port (Fly.io uses 8080 by default)
ENV PORT=8080

# Use the same start script as Render (starts API + Celery)
CMD ["./render-start.sh"]
