LAMBDA_DIST := dist
LAMBDA_BIN  := $(LAMBDA_DIST)/bootstrap
LAMBDA_ZIP  := $(LAMBDA_DIST)/scraper-lambda.zip
LAMBDA_PKG  := ./cmd/lambda

.PHONY: lambda-build lambda-zip lambda-clean

lambda-build:
	@mkdir -p $(LAMBDA_DIST)
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 \
		go build -tags lambda.norpc -ldflags="-s -w" -o $(LAMBDA_BIN) $(LAMBDA_PKG)

lambda-zip: lambda-build
	cd $(LAMBDA_DIST) && zip -j scraper-lambda.zip bootstrap

lambda-clean:
	rm -rf $(LAMBDA_DIST)
