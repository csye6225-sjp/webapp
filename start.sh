#!/bin/bash

# Exit on any error
set -e

# Check if required environment variables are set
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
  echo "Error: One or more required environment variables are missing."
  echo "Please set DB_NAME, DB_USER, and DB_PASSWORD"
  exit 1
fi

APP_DIR="/opt/csye6225"
APP_GROUP="csye6225"  
APP_USER="csye6225"

# 1. Update the package lists and upgrade packages
echo "Updating package lists..."
sudo apt-get update -y
echo "Upgrading packages..."
sudo apt-get upgrade -y

# 2. Install PostgreSQL
echo "Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib unzip

# 3. Start PostgreSQL service
echo "Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Create PostgreSQL database and user
echo "Setting up PostgreSQL database and user..."

# Switch to postgres user to execute SQL commands
sudo -u postgres psql <<EOF
-- Create user with password
DO
\$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
   END IF;
END
\$\$;
EOF

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"


echo "Database '${DB_NAME}' and user '${DB_USER}' setup complete."

echo "Creating /etc/csye6225.env file with environment variables..."
sudo tee /etc/csye6225.env > /dev/null <<EOF
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
EOF

# 5. Create a new Linux group for the application
echo "Creating Linux group '${APP_GROUP}'..."
if ! getent group ${APP_GROUP} > /dev/null; then
  sudo groupadd ${APP_GROUP}
else
  echo "Group '${APP_GROUP}' already exists."
fi

# 6. Create a new user for the application
echo "Creating Linux user '${APP_USER}'..."
if ! id -u "${APP_USER}" >/dev/null 2>&1; then
  sudo useradd -m -g "${APP_GROUP}" -s /usr/sbin/nologin "${APP_USER}"
  echo "User '${APP_USER}' created with nologin shell."
else
  echo "User '${APP_USER}' already exists."
fi

# 9. Update permissions of the folder and artifacts
echo "Updating permissions for '${APP_DIR}'..."
sudo chown -R ${APP_USER}:${APP_GROUP} ${APP_DIR}
sudo chmod -R 750 ${APP_DIR}

# 7. Install Node.js and npm
echo "Installing Node.js and npm..."
sudo apt-get install -y nodejs npm

# Verify installation
node -v
npm -v

sudo unzip /opt/csye6225/webapp.zip -d /opt/csye6225/webapp
sudo chown -R csye6225:csye6225 /opt/csye6225/webapp


# 10. Install Node.js dependencies
echo "Installing Node.js dependencies..."
sudo -u csye6225 bash -c "cd /opt/csye6225/webapp && npm install --omit=dev"

# 11. Run the application
# sudo -u ${APP_USER} DB_HOST=${DB_HOST} DB_PORT=${DB_PORT} DB_NAME=${DB_NAME} DB_USER=${DB_USER} DB_PASSWORD=${DB_PASSWORD} node server.js

echo "Setup complete! Application is deployed and running on '${APP_DIR}'." 

