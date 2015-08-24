fetch:
	curl https://percolate.com/api/v5/swagger.json -H 'Authorization: Bearer: ${SWAGGER_AUTH_TOKEN}' | python -m json.tool > ./data/v5.json
	curl https://percolate.com/api/v4/swagger.json -H 'Authorization: Bearer: ${SWAGGER_AUTH_TOKEN}' | python -m json.tool > ./data/v4.json
	curl https://percolate.com/api/v3/swagger.json -H 'Authorization: Bearer: ${SWAGGER_AUTH_TOKEN}' | python -m json.tool > ./data/v3.json

sync:
	aws s3 sync ./build/ s3://percolate-sashay/ --exclude '*' --include '*.js' --include '*.css' --include '*.html'

web:
	cat ./data/v5.json | ./bin/sashay build --destination ./build/v5/
	cat ./data/v4.json | ./bin/sashay build --destination ./build/v4/
	cat ./data/v3.json | ./bin/sashay build --destination ./build/v3/
