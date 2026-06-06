# TAMS – Ubuntu Server Deployment Guide

This guide covers deploying the Teacher Attendance Management System on an Ubuntu 22.04 LTS server using Docker and Docker Compose.

---

## Prerequisites

- Ubuntu 22.04 LTS server (minimum 2 GB RAM, 20 GB disk)
- A domain name (optional, but recommended for SSL)
- SSH access with sudo privileges

---

## Step 1 – Update System

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 2 – Install Docker

```bash
# Install dependencies
sudo apt install -y curl ca-certificates gnupg lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group (avoids needing sudo for docker commands)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Step 3 – Install Git

```bash
sudo apt install -y git
```

---

## Step 4 – Clone the Project

```bash
# Clone your repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/tams.git /opt/tams
cd /opt/tams
```

Or if you're copying files manually via SCP/SFTP:

```bash
sudo mkdir -p /opt/tams
sudo chown $USER:$USER /opt/tams
# Then copy your project files to /opt/tams
```

---

## Step 5 – Configure Environment Variables

```bash
cd /opt/tams

# Copy the example environment file
cp .env.example .env

# Edit the .env file with your values
nano .env
```

Set the following values in `.env`:

```env
DB_NAME=tams_db
DB_USER=tams_user
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_64_CHAR_STRING

NODE_ENV=production
PORT=5000
FRONTEND_URL=http://YOUR_SERVER_IP_OR_DOMAIN

VITE_API_URL=/api
```

> **Security tip:** Generate a strong JWT secret:
> ```bash
> openssl rand -base64 48
> ```

---

## Step 6 – Configure Nginx (for production with domain)

Edit the nginx config to point to your domain:

```bash
nano /opt/tams/nginx/nginx.conf
```

For HTTPS with Let's Encrypt (recommended), update the server block:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://tams_backend:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://tams_backend:5000/uploads/;
    }

    location / {
        proxy_pass http://tams_frontend:80/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### Install SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install -y certbot

# Obtain certificate (stop any service on port 80 first)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Create SSL directory and copy certs
sudo mkdir -p /opt/tams/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/tams/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/tams/nginx/ssl/
sudo chown -R $USER:$USER /opt/tams/nginx/ssl
```

---

## Step 7 – Build and Start the Application

### For Development / Testing (no SSL needed):

```bash
cd /opt/tams
docker compose up -d --build
```

### For Production (with Nginx reverse proxy):

```bash
cd /opt/tams
docker compose -f docker-compose.prod.yml up -d --build
```

Check that all containers are running:

```bash
docker compose ps
# or for production:
docker compose -f docker-compose.prod.yml ps
```

Expected output:
```
NAME               STATUS          PORTS
tams_db            Up (healthy)    5432/tcp
tams_backend       Up              5000/tcp
tams_frontend      Up              80/tcp
tams_nginx         Up              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

---

## Step 8 – Verify the Application

```bash
# Check backend health
curl http://localhost:5000/api/health

# Check backend logs
docker logs tams_backend -f

# Check database logs
docker logs tams_db -f

# Check all service logs
docker compose logs -f
```

Open in browser:
- Development: `http://YOUR_SERVER_IP:3000`
- Production: `http://YOUR_SERVER_IP` or `https://yourdomain.com`

Default login credentials (created automatically on first start):
- **Principal 1:** `admin` / `admin123`
- **Principal 2:** `principal2` / `principal123`

> **Important:** Change these passwords immediately after first login via the Settings page.

---

## Step 9 – Configure Automatic Daily Database Backup

```bash
# Create backup script
sudo nano /opt/tams/backup.sh
```

Paste the following:

```bash
#!/bin/bash
BACKUP_DIR="/opt/tams/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec tams_db pg_dump -U tams_user tams_db > "$BACKUP_DIR/tams_backup_$DATE.sql"

# Keep only last 30 backups
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete

echo "Backup completed: tams_backup_$DATE.sql"
```

```bash
# Make executable
sudo chmod +x /opt/tams/backup.sh

# Test the backup
/opt/tams/backup.sh

# Schedule daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/tams/backup.sh >> /var/log/tams_backup.log 2>&1") | crontab -
```

---

## Step 10 – Configure Firewall

```bash
# Install and enable UFW firewall
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# For development only (remove in production)
# sudo ufw allow 3000/tcp
# sudo ufw allow 5000/tcp

sudo ufw enable
sudo ufw status
```

---

## Step 11 – Auto-Start on Reboot

Docker services are already configured with `restart: always` in `docker-compose.prod.yml`. Enable the Docker service to start on boot:

```bash
sudo systemctl enable docker
```

Optionally create a systemd service for the compose stack:

```bash
sudo nano /etc/systemd/system/tams.service
```

```ini
[Unit]
Description=TAMS Docker Compose
Requires=docker.service
After=docker.service

[Service]
WorkingDirectory=/opt/tams
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
Restart=always
User=YOUR_USERNAME

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable tams
sudo systemctl start tams
```

---

## Common Management Commands

```bash
# View all container logs
docker compose logs -f

# Restart all services
docker compose restart

# Restart a single service
docker compose restart backend

# Stop everything
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Open database shell
docker exec -it tams_db psql -U tams_user -d tams_db

# Run a database query
docker exec tams_db psql -U tams_user -d tams_db -c "SELECT COUNT(*) FROM teachers;"

# View backend logs in real time
docker logs tams_backend -f --tail 100

# Check disk usage
docker system df
```

---

## Updating the Application

```bash
cd /opt/tams

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Verify
docker compose -f docker-compose.prod.yml ps
```

---

## Restoring a Backup

```bash
# Stop the app (keep the database running)
docker compose stop backend frontend

# Restore backup
docker exec -i tams_db psql -U tams_user -d tams_db < /opt/tams/backups/tams_backup_20240101_020000.sql

# Restart the app
docker compose start backend frontend
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Backend not starting | Check `docker logs tams_backend`. Database may not be ready yet; wait and retry. |
| Cannot connect to frontend | Check `docker logs tams_frontend` and `docker logs tams_nginx` |
| Database connection error | Ensure `DB_HOST=db` in `.env` (not `localhost`) |
| Geofence always rejecting | Set `school_latitude=0` and `school_longitude=0` in Settings to disable |
| Port 80 already in use | Run `sudo lsof -i :80` to find and stop the conflicting service |
| Out of disk space | Run `docker system prune -f` to clean unused images and containers |

---

## Production Security Checklist

- [ ] Changed default `admin` and `principal2` passwords
- [ ] Set strong `JWT_SECRET` (64+ characters)
- [ ] Set strong `DB_PASSWORD`
- [ ] Enabled HTTPS with SSL certificate
- [ ] Configured UFW firewall
- [ ] Automated daily database backups
- [ ] Set school geofence coordinates in Settings
- [ ] Verified attendance geofence is working correctly
