.PHONY: test

prepare:
	@docker build -t nestjs/cli .
	@docker run \
		-v $$(pwd):/usr/local/app \
		nestjs/cli \
		/bin/sh -c "npm install"

test:
	@docker run -t \
		-v $$(pwd):/usr/local/app \
		nestjs/cli \
		/bin/sh -c "npm run -s test"

build:
	@docker run -t \
		-v $$(pwd):/usr/local/app \
		nestjs/cli \
		/bin/sh -c "npm run -s build"

publish:
	@docker run -t \
		-v $$(pwd)/schematics:/usr/local/app \
		nestjs/cli \
		/bin/sh -c "\
			echo //registry.npmjs.org/:_authToken=$$NPM_TOKEN>>.npmrc && \
			npm publish"