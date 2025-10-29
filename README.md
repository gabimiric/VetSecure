# VetSecure Development Setup

## Quick Start

### Option 1: Using the Run Script (Easiest)
```bash
./run-dev.sh
```

### Option 2: Manual Setup

#### 1. Start MySQL Database
```bash
docker compose up -d
```

#### 2. Start Backend (Terminal 1)
```bash
export DB_USERNAME=appuser
export DB_PASSWORD=apppass
export ENCRYPTION_SECRET=rB4uM8pX2sK9vN3wL6tQ1yE5hJ8mC4dG7fA0zW

./mvnw spring-boot:run -Dspring-boot.run.profiles=dev -DskipTests
```

The backend will start on **http://localhost:8082**

#### 3. Start Frontend (Terminal 2)
```bash
cd frontend
npm install  # Only needed the first time
npm start
```

<<<<<<< Updated upstream
(in front try to add an pet owner it shoul be written after"Saved!" if everything is fine)
=======
The frontend will start on **http://localhost:3000**
>>>>>>> Stashed changes

## Database Access

Open **http://localhost:8081** in your browser for Adminer (database console):

- **System:** MySQL / MariaDB (already selected)
- **Server:** mysql (change from 127.0.0.1 to mysql)
- **Username:** appuser
- **Password:** apppass
- **Database:** vetsecure

## Troubleshooting

### Backend SSL Error
If you see SSL keystore errors, make sure you're using the `dev` profile:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### Database Connection Error
Make sure MySQL is running:
```bash
docker compose up -d
docker ps  # Should show vetsecure-mysql container
```

<<<<<<< Updated upstream
Username: appuser

Password: apppass

Database: vetsecure

there if you look at the table with owners on left and open SELECT DATA the new owner will be shown.
=======
### Frontend Proxy Error
The frontend is configured to proxy to `http://localhost:8082`. Make sure the backend is running on port 8082.
>>>>>>> Stashed changes
