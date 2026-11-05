# ==========================================
# Multi-stage Dockerfile for Railway
# Deploys Full-stack NovaBotica (API + SPA)
# ==========================================

# 1. Frontend Build
FROM node:22-bookworm-slim AS web-build
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package.json ./
RUN npm install

# Build Vite SPA production assets
COPY frontend ./
RUN npm run build

# 2. Backend Build with bundled static SPA
FROM maven:3.9-eclipse-temurin-21 AS java-build
WORKDIR /build

COPY backend/pom.xml ./
COPY backend/src ./src
COPY backend/database ./database

# Copy Vite dist to Spring Boot static resources
COPY --from=web-build /app/frontend/dist ./src/main/resources/static

# Build standalone executable JAR
RUN mvn -B package -DskipTests

# 3. Production Runtime
FROM eclipse-temurin:21-jre-jammy AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 nova

WORKDIR /app
COPY --from=java-build /build/target/nova-salud-api.jar ./app.jar
RUN mkdir -p /app/.local && chown -R nova:nova /app

USER nova
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
