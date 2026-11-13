# SmartOMR Production Deployment Guide

This guide covers deploying SmartOMR into a high-availability, secure production environment (Ubuntu 22.04 LTS / Debian 12 / Cloud VM).

---

## 1. Production Architecture Overview

In production, SmartOMR is served via a unified reverse-proxy architecture:
- **Domain:** `https://smartomr.yourinstitution.edu`
- **Reverse Proxy:** **Nginx** terminates TLS/HTTPS and routes:
  - `/` &rarr; Compiled React static bundle (`frontend/dist/`)
  - `/api/*` &rarr; Laravel 12 via PHP 8.2-FPM (`backend/public/index.php`)
  - `/storage/*` &rarr; Uploaded and annotated images (`backend/storage/app/public/`)
  - Internal network &rarr; Python FastAPI OMR Microservice on `127.0.0.1:8001` (managed by `systemd`)

---

## 2. Server Prerequisites & Package Installation

On a fresh Ubuntu 22.04 LTS server:

```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Essential Utilities
sudo apt install -y curl git unzip software-properties-common ufw nginx certbot python3-certbot-nginx

# Add PHP 8.2 PPA
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update

# Install PHP 8.2 and required extensions
sudo apt install -y php8.2-fpm php8.2-cli php8.2-mysql php8.2-mbstring \
    php8.2-xml php8.2-curl php8.2-zip php8.2-gd php8.2-intl php8.2-bcmath

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Python 3.11 & OpenCV dependencies
sudo apt install -y python3-pip python3-venv python3-dev libgl1-mesa-glx libglib2.0-0

# Install MySQL 8.0 Server
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 3. Clone Repository & Directory Structure

```bash
sudo mkdir -p /var/www/smartomr
sudo chown -R $USER:www-data /var/www/smartomr
git clone <your-repository-url> /var/www/smartomr
cd /var/www/smartomr
```

---

## 4. Database Setup (MySQL 8.0)

Log in to MySQL:
```bash
sudo mysql -u root -p
```

Create production database and dedicated user:
```sql
CREATE DATABASE smartomr CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'smartomr_user'@'localhost' IDENTIFIED BY 'StrongProductionPassword987!';
GRANT ALL PRIVILEGES ON smartomr.* TO 'smartomr_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Import initial schema and seeds:
```bash
mysql -u smartomr_user -p smartomr < /var/www/smartomr/docs/smartomr_mysql_schema.sql
```

---

## 5. Backend Configuration (`backend/`)

1. **Install Composer dependencies:**
   ```bash
   cd /var/www/smartomr/backend
   composer install --no-dev --optimize-autoloader
   ```

2. **Configure Production `.env`:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```ini
   APP_NAME="SmartOMR"
   APP_ENV=production
   APP_KEY=base64:YOUR_APP_KEY_HERE
   APP_DEBUG=false
   APP_URL=https://smartomr.yourinstitution.edu

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=smartomr
   DB_USERNAME=smartomr_user
   DB_PASSWORD=StrongProductionPassword987!

   # Vision Engine Microservice
   OMR_ENGINE_URL=http://127.0.0.1:8001
   OMR_ENGINE_API_KEY=YOUR_RANDOMLY_GENERATED_SECRET_KEY_2026

   SESSION_SECURE_COOKIE=true
   SANCTUM_STATEFUL_DOMAINS=smartomr.yourinstitution.edu
   ```

3. **Generate App Key and Cache Configuration:**
   ```bash
   php artisan key:generate
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan storage:link
   ```

4. **Set Permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/smartomr/backend/storage /var/www/smartomr/backend/bootstrap/cache
   sudo chmod -R 775 /var/www/smartomr/backend/storage /var/www/smartomr/backend/bootstrap/cache
   ```

---

## 6. Python Vision Engine Setup (`omr-engine/`)

1. **Create dedicated virtual environment:**
   ```bash
   cd /var/www/smartomr/omr-engine
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

2. **Create Systemd Service (`/etc/systemd/system/smartomr-vision.service`):**
   ```ini
   [Unit]
   Description=SmartOMR Python Computer Vision Microservice
   After=network.target

   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/smartomr/omr-engine
   Environment="PATH=/var/www/smartomr/omr-engine/venv/bin"
   Environment="API_KEY=YOUR_RANDOMLY_GENERATED_SECRET_KEY_2026"
   ExecStart=/var/www/smartomr/omr-engine/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 4

   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start the service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable smartomr-vision
   sudo systemctl start smartomr-vision
   sudo systemctl status smartomr-vision
   ```

---

## 7. Frontend Production Build (`frontend/`)

1. **Configure Environment:**
   Create `/var/www/smartomr/frontend/.env.production`:
   ```ini
   VITE_API_URL=https://smartomr.yourinstitution.edu/api
   ```

2. **Install and Compile:**
   ```bash
   cd /var/www/smartomr/frontend
   npm install
   npm run build
   ```
   The production-ready assets will be generated in `/var/www/smartomr/frontend/dist`.

---

## 8. Nginx & SSL/HTTPS Configuration

> **CRITICAL SECURITY NOTE:**
> Modern mobile web browsers (Chrome on Android, Safari on iOS) **disable** camera access via `navigator.mediaDevices.getUserMedia` when loaded over unencrypted HTTP. A valid SSL/TLS certificate is mandatory for mobile OMR scanning to function.

Create Nginx site configuration `/etc/nginx/sites-available/smartomr`:

```nginx
server {
    listen 80;
    server_name smartomr.yourinstitution.edu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name smartomr.yourinstitution.edu;

    # SSL Certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/smartomr.yourinstitution.edu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/smartomr.yourinstitution.edu/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Maximum payload size for high-resolution 12MP/48MP camera uploads
    client_max_body_size 25M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # 1. Frontend React Single Page App
    root /var/www/smartomr/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 2. Uploaded Storage Assets (Original & Processed Annotated Sheets)
    location /storage/ {
        alias /var/www/smartomr/backend/storage/app/public/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 3. Laravel REST API Backend
    location /api/ {
        alias /var/www/smartomr/backend/public/;
        try_files $uri $uri/ @laravel;

        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/smartomr/backend/public/index.php;
            include fastcgi_params;
            fastcgi_read_timeout 60s;
        }
    }

    location @laravel {
        rewrite /api/(.*)$ /api/index.php?/$1 last;
    }

    # Deny access to sensitive files
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Enable site and obtain SSL Certificate:
```bash
sudo ln -s /etc/nginx/sites-available/smartomr /etc/nginx/sites-enabled/
sudo nginx -t
sudo certbot --nginx -d smartomr.yourinstitution.edu
sudo systemctl reload nginx
```

---

## 9. Firewall (UFW) Configuration

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 10. Automated Maintenance & Backups

Set up daily automated MySQL database backups:

Create backup script `/usr/local/bin/backup-smartomr.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/smartomr"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"
mysqldump -u smartomr_user -p'StrongProductionPassword987!' smartomr | gzip > "$BACKUP_DIR/smartomr_$TIMESTAMP.sql.gz"
find "$BACKUP_DIR" -type f -mtime +30 -delete
```

Make executable and register in root crontab:
```bash
sudo chmod +x /usr/local/bin/backup-smartomr.sh
sudo crontab -e
```
Add:
```cron
0 2 * * * /usr/local/bin/backup-smartomr.sh
```

