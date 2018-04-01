all: build

install:
	@docker run -t \
		-w /home/cli \
		-v $$(pwd):/home/cli \
		node:carbon-alpine \
		/bin/sh -c "npm install"

build:
	@docker build -t nestjs/cli:$$VERSION .

publish:
	@docker run -t \
		-w /home/cli \
		-v $$(pwd):/home/cli \
		node:carbon-alpine \
		/bin/sh -c "\
			echo //registry.npmjs.org/:_authToken=$$NPM_TOKEN >> .npmrc && \
			npm publish && \
			echo 'PUBLISH DONE ' \
		"
