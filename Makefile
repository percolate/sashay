fetch:
	curl https://percolate.com/api/v5/swagger.json -H 'Authorization: Bearer: ${SWAGGER_AUTH_TOKEN}' | python -m json.tool > ./data/v5.json
	curl https://percolate.com/api/v4/swagger.json -H 'Authorization: Bearer: ${SWAGGER_AUTH_TOKEN}' | python -m json.tool > ./data/v4.json
	curl https://percolate.com/api/v3/swagger.json -H 'Authorization: Bearer: ${SWAGGER_AUTH_TOKEN}' | python -m json.tool > ./data/v3.json

sync:
	aws s3 sync ./build/ s3://percolate-sashay/ --exclude '*' --include '*.js' --include '*.css' --include '*.html'

update:
	make fetch
	make web
	make sync

web:
	./bin/sashay ./data/v5.json -o web -d ./build/v5/
	./bin/sashay ./data/v4.json -o web -d ./build/v4/
	./bin/sashay ./data/v3.json -o web -d ./build/v3/
