build-docker-artifact:
	@docker build -t nestjs/cli:$$ARTIFACT_ID .

publish-docker-artifact:
	@docker login -u $$DOCKER_USER -p $$DOCKER_PASSWORD
	@docker push nestjs/cli:$$ARTIFACT_ID

publish-docker-edge:
	@docker login -u $$DOCKER_USER -p $$DOCKER_PASSWORD
	@docker pull nestjs/cli:$$ARTIFACT_ID
	@docker tag nestjs/cli:$$ARTIFACT_ID nestjs/cli:4-edge
	@docker push nestjs/cli:4-edge

publish-docker-release:
	@docker login -u $$DOCKER_USER -p $$DOCKER_PASSWORD
	@docker pull nestjs/cli:$$ARTIFACT_ID
	@docker tag nestjs/cli:$$ARTIFACT_ID nestjs/cli:$$RELEASE_VERSION
	@docker push nestjs/cli:$$RELEASE_VERSION
	@docker tag nestjs/cli:$$ARTIFACT_ID nestjs/cli:4
	@docker push nestjs/cli:4
	@docker tag nestjs/cli:$$ARTIFACT_ID nestjs/cli:latest
	@docker push nestjs/cli:latest

publish-npm-release:
	@docker pull nestjs/cli:$$ARTIFACT_ID
	@docker run -w /nestjs/cli nestjs/cli:$$ARTIFACT_ID \
		/bin/sh -c "\
			echo //registry.npmjs.org/:_authToken=$$NPM_TOKEN >> .npmrc && \
			npm publish \
		"