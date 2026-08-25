# ============================================
# Dockerfile - Backend (Spring Boot + Java 17)
# Multi-stage build để tối ưu kích thước image
# ============================================

# === Stage 1: Build với Maven ===
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml trước để cache dependencies layer
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .

# Download dependencies (layer này được cache nếu pom.xml không đổi)
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build JAR file (bỏ qua tests vì đã test ở CI/CD)
RUN mvn clean package -DskipTests -B

# === Stage 2: Runtime với JRE nhẹ ===
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Tạo user non-root cho bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy JAR từ stage build
COPY --from=build /app/target/*.jar app.jar

# Chuyển sang user non-root
USER appuser

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "app.jar"]
