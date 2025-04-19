FROM ubuntu:22.04

WORKDIR /app

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl git build-essential

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Scarb directly from GitHub releases
RUN mkdir -p ~/.local/bin && \
    curl -L https://github.com/software-mansion/scarb/releases/download/v2.4.4/scarb-v2.4.4-x86_64-unknown-linux-gnu.tar.gz | tar -xz && \
    mv scarb-v2.4.4-x86_64-unknown-linux-gnu/bin/scarb ~/.local/bin/ && \
    chmod +x ~/.local/bin/scarb && \
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc

# Set PATH for subsequent commands
ENV PATH="/root/.local/bin:/root/.cargo/bin:${PATH}"

# Verify installation
RUN . ~/.bashrc && scarb --version

COPY . .

# Use an entrypoint script to ensure PATH is properly set
RUN echo '#!/bin/bash\nsource ~/.bashrc\nexec "$@"' > /entrypoint.sh && \
    chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["scarb", "build"]
