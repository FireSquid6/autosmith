FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    unzip \
    zip \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Bun

RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

WORKDIR /workspace

# Keep the container alive so exec-based commands can run
CMD ["sleep", "infinity"]
