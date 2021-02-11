
.PHONY : help
help : Makefile
	@sed -n 's/^##//p' $<

## test: runs tests
.PHONY: test
test:
	npm i
	npm run-script coverage

## compile: builds for deployment
.PHONY: deploy
compile:
	npm i
	npm run build -- --full
	npm run deploy