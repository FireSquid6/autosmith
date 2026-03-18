FROM golang:1.23-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    unzip \
    zip \
    ca-certificates \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

ENV GOPATH=/root/go
ENV PATH="$GOPATH/bin:$PATH"

WORKDIR /workspace

CMD ["sleep", "infinity"]
