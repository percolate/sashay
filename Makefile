coverage-cli:
	./node_modules/.bin/istanbul cover \
		--root ./lib/cli \
		--dir ./lib/cli/coverage \
		-x **/__test__/** \
		./node_modules/.bin/_mocha ./lib/cli/__test__/*.spec.js

coverage-ui:
	./node_modules/.bin/karma start ./lib/ui/__test__/karma.config.js \
		--mode coverage

dev-ui:
	./node_modules/.bin/karma start ./lib/ui/__test__/karma.config.js \
		--mode dev

style:
	./node_modules/.bin/eslint ./lib/ \
		--ext '.js,.jsx' \
		--ignore-pattern **/coverage/**
	
	./node_modules/.bin/prettier README.md .eslintrc.js "lib/**/*.{js,jsx}" --list-different

test-cli:
	./node_modules/.bin/mocha ./lib/cli/__test__/*.spec.js \
		--reporter spec

test-ui:
	./node_modules/.bin/karma start ./lib/ui/__test__/karma.config.js

version:
	git checkout -b version
	npm version $(v)
	git push origin version --tags
