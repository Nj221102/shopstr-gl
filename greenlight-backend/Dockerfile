FROM rust:latest as builder

# Install protobuf compiler
RUN apt-get update && apt-get install -y protobuf-compiler

# Create a new empty project
WORKDIR /usr/src/greenlight-backend
COPY . .

# Build the application
RUN cargo build --release

# Runtime image - using the same base image as the builder to ensure compatibility
FROM debian:bookworm-slim

# Install SSL certificates and other runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /usr/src/greenlight-backend/target/release/greenlight-backend /usr/local/bin/greenlight-backend

# Expose the port the app runs on
EXPOSE 8081

# Command to run the application
CMD ["greenlight-backend"]