FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml ./
RUN mvn -B dependency:go-offline
COPY src ./src
COPY database ./database
RUN mvn -B package -DskipTests

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 nova
WORKDIR /app
COPY --from=build /app/target/nova-salud-api.jar ./app.jar
RUN mkdir -p /app/.local && chown -R nova:nova /app
USER nova
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
