FROM eclipse-temurin:21-jdk-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    unzip \
    zip \
    ca-certificates \
    build-essential \
    maven \
    && rm -rf /var/lib/apt/lists/*

# Install Gradle
RUN curl -fsSL https://services.gradle.org/distributions/gradle-8.10-bin.zip -o /tmp/gradle.zip \
    && unzip -q /tmp/gradle.zip -d /opt \
    && rm /tmp/gradle.zip
ENV PATH="/opt/gradle-8.10/bin:$PATH"

WORKDIR /workspace

CMD ["sleep", "infinity"]
