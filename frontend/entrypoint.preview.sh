#!/bin/sh

# This script installs necessary dependencies for a project, generates the prisma client and migrates the database, before starting up. The project directory, path depends on the project path.
set -e

# Check if project path exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project directory '$PROJECT_PATH' does not exist"
    exit 1
fi


cd /app/project

# Variable to track the server process ID
SERVER_PID=""

# Function to start/restart the server
start_server() {
    echo "Starting server..."
    if [ -n "$START_COMMAND" ]; then
        echo "Using custom start command: $START_COMMAND"
        $START_COMMAND &
    else
        echo "Using default command: pnpm dev"
        pnpm dev &
    fi
    SERVER_PID=$!
    echo "Server started with PID: $SERVER_PID"
}

# background sync.
while true; do
    rsync -a --exclude 'node_modules' ${PROJECT_PATH}/ /app/project
    # Install dependencies only if package.json has changed
    if [ -f "package.json" ]; then
        CHECKSUM_FILE="node_modules/.package-json.md5"
        NEEDS_INSTALL=false

        if [ ! -f "$CHECKSUM_FILE" ]; then
            NEEDS_INSTALL=true
            echo "Checksum file not found. Dependencies will be installed."
        else
            OLD_CHECKSUM=$(cat "$CHECKSUM_FILE")
            NEW_CHECKSUM=$(openssl md5 -r package.json | awk '{print $1}')
            if [ "$OLD_CHECKSUM" != "$NEW_CHECKSUM" ]; then
                NEEDS_INSTALL=true
                echo "package.json has changed. Dependencies will be installed."
            else
                echo "package.json has not changed. Skipping dependency installation."
            fi
        fi

        if [ "$NEEDS_INSTALL" = true ]; then
            echo "Installing dependencies..."
            CI=true pnpm install
            openssl md5 -r package.json | awk '{print $1}' > "$CHECKSUM_FILE"
            
            # Restart server after successful dependency installation
            if [ -n "$SERVER_PID" ] && kill -0 $SERVER_PID 2>/dev/null; then
                echo "Restarting server after dependency installation..."
                kill $SERVER_PID 2>/dev/null || true
                sleep 2
                start_server
            fi
        fi
    else
        CI=true pnpm install
    fi
  sleep 30
done &

# Install dependencies
pnpm install

# Start the server using the function
start_server

# Keep the script running and wait for the server process
wait $SERVER_PID