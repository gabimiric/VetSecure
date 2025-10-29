#!/bin/bash

# VetSecure Development Run Script
# This script starts both the backend and frontend for local development

echo "🚀 Starting VetSecure Development Environment..."

# Set environment variables
export DB_USERNAME=appuser
export DB_PASSWORD=apppass
export ENCRYPTION_SECRET=rB4uM8pX2sK9vN3wL6tQ1yE5hJ8mC4dG7fA0zW

# Check if MySQL is running
if ! docker ps | grep -q vetsecure-mysql; then
    echo "📦 Starting MySQL container..."
    docker compose up -d
    echo "⏳ Waiting for MySQL to be ready..."
    sleep 5
fi

# Start backend in background
echo "🔧 Starting Backend (port 8082)..."
cd "$(dirname "$0")"
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev -DskipTests &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Start frontend
echo "⚛️  Starting Frontend (port 3000)..."
cd frontend
npm start &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ Development servers started!"
echo "   Backend: http://localhost:8082"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

