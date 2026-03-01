---
name: vps-deployment
description: Generates deployment configuration files (Dockerfile, docker-compose.yml, Nginx config) for deploying web applications on a VPS using Docker Compose and a host Nginx reverse proxy.
---

# VPS Deployment Skill

## Overview

You are responsible for generated deployment documentation and configuration files for web applications. The user deploys their applications on a **Virtual Private Server (VPS)**.

## Core Infrastructure Details (CRITICAL CONTEXT)

ALWAYS remember the following constraints and architecture when generating deployment files:

1. **Host System:** A Virtual Private Server (VPS).
2. **Containerization:** The application MUST be containerized using `Docker` and orchestrated using `Docker Compose`.
3. **Port Management:**
   - The VPS hosts **multiple web applications**.
   - Therefore, the host's default web ports (`80` and `443`) are ALREADY IN USE by the host's main Nginx service.
   - Applications inside Docker **must NOT** bind directly to ports 80 or 443 on the host.
   - You must assign a **custom, non-conflicting host port** (e.g., `3050`, `8080`, `4000`) in the `docker-compose.yml` that maps to the internal container port (e.g., `3000` for Next.js).
4. **Traffic Routing:**
   - The host OS uses **Nginx** directly installed on the machine (NOT dockerized) as a reverse proxy.
   - This host Nginx listens on ports 80/443 and routes incoming traffic based on the domain name (`server_name`) to the specific local custom port exposed by the Docker container (e.g., `proxy_pass http://127.0.0.1:3050;`).
5. **Data Persistence:**
   - If the application uses a local database (like SQLite), the database file MUST be stored outside the container using Docker Volumes to ensure data is not lost when the container is rebuilt or restarted.

## Workflow: Generating Deployment Files

When asked to prepare an app for deployment, you must generate three main configurations:

### 1. `Dockerfile`
- Create a multi-stage Dockerfile optimized for the framework used (e.g., Next.js, Node.js).
- Ensure required dependencies (like `openssl` for Prisma) are installed.
- Include necessary build commands.
- Define a clear starting command (`CMD`).

### 2. `docker-compose.yml`
- Define the service for the web app.
- Set `restart: unless-stopped`.
- Map the ports correctly: `"[CUSTOM_HOST_PORT]:[CONTAINER_PORT]"` (e.g., `"3050:3000"`).
- Mount volumes for persistence if a local database (like SQLite) or uploaded media is used. Example:
  ```yaml
  volumes:
    - app_data:/app/data
  ```
- Pass necessary environment variables (e.g., `NODE_ENV=production`, `DATABASE_URL`).

### 3. Nginx Host Configuration (`nginx.sample.conf`)
- Provide a sample configuration file intended to be placed in `/etc/nginx/sites-available/` on the host VPS.
- Include the `server_name` directive (placeholder).
- Configure the `location /` block to `proxy_pass` to the `127.0.0.1:[CUSTOM_HOST_PORT]` defined in the `docker-compose.yml`.
- Include standard proxy headers (`X-Real-IP`, `X-Forwarded-For`, `Upgrade`, `Connection`).

## Execution

When invoking this skill, thoroughly analyze the project's tech stack (e.g., Next.js, Prisma, SQLite) and generate the aforementioned files tailored to that stack, strictly adhering to the VPS architecture rules.
