# sashay

[![Circle CI](https://circleci.com/gh/percolate/sashay.svg?style=svg&circle-token=fa8012bb291abb365e5b0ff8f2a520e0ff889c02)](https://circleci.com/gh/percolate/sashay)

Generates API documentation from a Swagger definition.

## Installation

```sh
npm install git+ssh://git@github.com/percolate/sashay.git
```

## Usage

Start the development server (watches `swagger.yaml` for changes):

```sh
./node_modules/.bin/sashay up ./swagger.yaml
```

Build the website:

```sh
./node_modules/.bin/sashay build ./swagger.yaml
```
