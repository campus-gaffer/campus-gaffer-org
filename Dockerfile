FROM golang:1.26-alpine
WORKDIR /app
COPY campus-gaffer-backend/ .
RUN go mod tidy
RUN go build -o cmd