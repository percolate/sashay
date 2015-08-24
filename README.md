# sashay

[![Circle CI](https://circleci.com/gh/percolate/sashay.svg?style=svg&circle-token=fa8012bb291abb365e5b0ff8f2a520e0ff889c02)](https://circleci.com/gh/percolate/sashay)
[![codecov.io](http://codecov.io/github/percolate/sashay/coverage.svg?branch=master&token=kdC8b1dlwH)](http://codecov.io/github/percolate/sashay?branch=master)

A CLI for generating API documentation from a Swagger definition.

## Usage

```sh
$ sashay [options] <command>
```

## Advanced

Install [AWS CLI](https://aws.amazon.com/cli/). Some commands require the following environment variables:

```
AWS_ACCESS_KEY
AWS_SECRET_KEY
SWAGGER_AUTH_TOKEN
```

Pull the latest Swagger definitions from percolate.com, build and sync with AWS S3:

```sh
make fetch
make web
make sync
```

## Deploy

Every push to master is pushed to the percolate-sashay Heroku application.

## Logs

Login with the Heroku CLI and run:

```sh
heroku logs --app percolate-sashay
```
