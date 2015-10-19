# sashay

[![Circle CI](https://circleci.com/gh/percolate/sashay.svg?style=svg&circle-token=fa8012bb291abb365e5b0ff8f2a520e0ff889c02)](https://circleci.com/gh/percolate/sashay)
[![codecov.io](http://codecov.io/github/percolate/sashay/coverage.svg?branch=master&token=kdC8b1dlwH)](http://codecov.io/github/percolate/sashay?branch=master)

A CLI for generating API documentation from a Swagger definition.

## Usage

```sh
sashay [options] <source>
```

See [REFERENCE](https://github.com/percolate/sashay/blob/master/REFERENCE.md) for complete API reference.

### Writing and previewing documentation

The following command will start a local web server at [http://127.0.0.1:8000/](http://127.0.0.1:8000/) and watch your local files. Changes to `swagger.yml` will be reflected in your web browser.

```sh
sashay swagger.yml --output web --watch
```

### Pushing to S3

Documentation is hosted on AWS S3. To update the docs, just generate the new web assets and sync. You must have the [AWS CLI](https://aws.amazon.com/cli/). Some commands require the following environment variables:

```
AWS_ACCESS_KEY
AWS_SECRET_KEY
SWAGGER_AUTH_TOKEN
```

The following commands pull the latest Swagger definitions from percolate.com, build and sync with AWS S3:

```sh
make fetch
make web
make sync
```

## Deployment

Every push to master is pushed to the percolate-sashay Heroku application. The sync command run a cron every 10 minutes.

### Configuration

When creating a new Heroku application, run the following configuration:

```sh
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-multi.git
heroku addons:create scheduler:standard
heroku addons:open scheduler
```

Then [schedule the job](https://devcenter.heroku.com/articles/scheduler#scheduling-jobs) `make update`.
