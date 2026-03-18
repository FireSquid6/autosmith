FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    unzip \
    zip \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast Python package management
RUN curl -fsSL https://astral.sh/uv/install.sh | bash
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /workspace

CMD ["sleep", "infinity"]
