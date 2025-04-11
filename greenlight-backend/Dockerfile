FROM rust:1.75 as builder

# Install protobuf compiler
RUN apt-get update && apt-get install -y protobuf-compiler

# Create a new empty project
WORKDIR /usr/src/greenlight-backend
COPY . .

# Build the application
RUN cargo build --release

# Runtime image
FROM debian:bullseye-slim

# Install SSL certificates
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the binary from the builder stage
COPY --from=builder /usr/src/greenlight-backend/target/release/greenlight-backend /usr/local/bin/greenlight-backend

# Expose the port the app runs on
EXPOSE 8081

# Command to run the application
CMD ["greenlight-backend"]