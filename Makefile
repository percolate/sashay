.DEFAULT_GOAL := install

install:
	yarn install --frozen-lockfile

coverage-cli:
	rm -rf lib/cli/coverage
	./node_modules/.bin/nyc \
		--report-dir "lib/cli/coverage" \
		--include "lib/cli/**" \
		--exclude "**/__test__/**" \
		--reporter lcovonly \
		--reporter html \
		./node_modules/.bin/_mocha ./lib/cli/__test__/*.spec.js

coverage-ui:
	rm -rf lib/ui/coverage
	./node_modules/.bin/karma start ./lib/ui/__test__/karma.config.js \
		--mode coverage

dev-ui:
	./node_modules/.bin/karma start ./lib/ui/__test__/karma.config.js \
		--mode dev

style:
	./node_modules/.bin/eslint ./lib/ \
		--ext '.js,.jsx' \
		--ignore-pattern **/coverage/**
	
	./node_modules/.bin/prettier README.md .eslintrc.js .circleci/config.yml "lib/**/*.{js,jsx}" --list-different

test-cli:
	./node_modules/.bin/mocha ./lib/cli/__test__/*.spec.js \
		--reporter spec

test-ui:
	./node_modules/.bin/karma start ./lib/ui/__test__/karma.config.js

version:
	git checkout -b version
	npm version $(v)
	git push origin version --tags
