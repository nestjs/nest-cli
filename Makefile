.PHONY: e2e

artefact:
	@docker build -t nestjs/cli:$$ARTEFACT_ID .

e2e:
	@docker build -t nestjs/cli-e2e:$$ARTEFACT_ID --build-arg ARTEFACT_ID=$$ARTEFACT_ID ./e2e
	-@docker run -it nestjs/cli-e2e:$$ARTEFACT_ID

publish-artefact:
	@docker login -u $$DOCKER_USER -p $$DOCKER_PASSWORD
	@docker push nestjs/cli:$$ARTEFACT_ID

publish-edge:
	@docker login -u $$DOCKER_USER -p $$DOCKER_PASSWORD
	@docker pull nestjs/cli:$$ARTEFACT_ID
	@docker tag nestjs/cli:$$ARTEFACT_ID nestjs/cli:5-edge
	@docker push nestjs/cli:5-edge

publish-release: prepublish
	@docker login -u $$DOCKER_USER -p $$DOCKER_PASSWORD
	@docker pull nestjs/cli:$$ARTEFACT_ID
	@docker tag nestjs/cli:$$ARTEFACT_ID nestjs/cli:$$RELEASE_VERSION
	@docker push nestjs/cli:$$RELEASE_VERSION
	@docker tag nestjs/cli:$$ARTEFACT_ID nestjs/cli:5
	@docker push nestjs/cli:5
	@docker tag nestjs/cli:$$ARTEFACT_ID nestjs/cli:latest
	@docker push nestjs/cli:latest

publish-npm-package: prepublish
	@docker pull nestjs/cli:$$ARTEFACT_ID
	@docker run -w /nestjs/cli nestjs/cli:$$ARTEFACT_ID \
		/bin/sh -c "\
			echo //registry.npmjs.org/:_authToken=$$NPM_TOKEN >> .npmrc && \
			npm publish \
		"

prepublish:
	@docker pull nestjs/cli:$$ARTEFACT_ID
	@CONTAINER_ID=$$(docker create -t -w /workspace node:carbon-alpine /bin/sh -c "node scripts/check-version.js $$RELEASE_VERSION") && \
	docker cp scripts/ $$CONTAINER_ID:/workspace && \
	docker cp package.json $$CONTAINER_ID:/workspace/package.json && \
	docker start -a $$CONTAINER_ID