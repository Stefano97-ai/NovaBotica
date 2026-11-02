FROM node:24-bookworm-slim AS web-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci
COPY frontend ./frontend
RUN npm run build --workspace frontend

FROM maven:3.9-eclipse-temurin-21 AS java-build
WORKDIR /build
COPY backend/pom.xml ./
RUN mvn -B dependency:go-offline
COPY backend/src ./src
COPY backend/database ./database
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-jammy AS api
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/* && useradd --create-home --uid 10001 nova
WORKDIR /app/backend
COPY --from=java-build /build/target/nova-salud-api.jar ./app.jar
RUN mkdir -p /app/.local && chown -R nova:nova /app
USER nova
ENTRYPOINT ["java", "-jar", "app.jar"]

FROM nginx:stable-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/frontend/dist /usr/share/nginx/html
