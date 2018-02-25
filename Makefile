.PHONY: test

prepare:
	@docker build -t nestjs/schematics .
	@docker run \
		-v $$(pwd):/usr/local/app \
		nestjs/schematics \
		/bin/sh -c "npm install"

test:
	@docker run \
		-v $$(pwd):/usr/local/app \
		nestjs/schematics \
		/bin/sh -c "npm run -s test"

build:
	@docker run \
		-v $$(pwd):/usr/local/app \
		nestjs/schematics \
		/bin/sh -c "npm run -s build"

publish:
	@docker run \
		-v $$(pwd)/schematics:/usr/local/app \
		nestjs/schematics \
		/bin/sh -c "\
			echo //registry.npmjs.org/:_authToken=$$NPM_TOKEN>>.npmrc && \
			npm publish"