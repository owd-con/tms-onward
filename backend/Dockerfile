FROM alpine:latest

RUN apk add --no-cache tzdata
# ENV TZ="Asia/Jakarta"

ARG COMMIT=""

# Copy Pre-built binary
COPY onward-tms .

# Not Secret env variable
ENV SERVICE_NAME="svc-tms"
ENV SERVICE_VERSION=${COMMIT}
ENV REST_SERVER="0.0.0.0:80"
ENV GRPC_SERVER="0.0.0.0:40"
ENV GRPC_ADDRESS="svc-tms:40"

# Expose port 80 to the outside world
EXPOSE 80 40

# Command to run the executable
CMD ["./onward-tms"]
