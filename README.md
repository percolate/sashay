# sashay

[![Circle CI](https://circleci.com/gh/percolate/sashay.svg?style=svg&circle-token=fa8012bb291abb365e5b0ff8f2a520e0ff889c02)](https://circleci.com/gh/percolate/sashay)
[![codecov.io](http://codecov.io/github/percolate/sashay/coverage.svg?branch=master&token=kdC8b1dlwH)](http://codecov.io/github/percolate/sashay?branch=master)

A library for generating API documentation from a [RAML v0.8](https://github.com/raml-org/raml-spec/blob/master/raml-0.8.md) definition.

## Installation

```
npm install sashay
```

## Usage

### CLI

```
sashay [options] <source>
```

Use `sashay --help` for CLI reference.

### JavaScript

```
var sashay = require('sashay')

sashay(options)
```

### **`options`** `Object`

- **`destination`** `String`

    The build directory. Default `'./build/'`.

- **`output`** `String`

    The output format. Must be `'json'` or `'web'`. Default `'json'`.

- **`quiet`** `Boolean`

    Set to `true` to suppress logs. Default `false`.

- **`source`** `String`

    The source file. Must be valid RAML. Required.

- **`watch`** `Boolean`

    Watches files for changes and rebuilds. In `'web'` mode, starts a preview server at [http://127.0.0.1:8000/](http://127.0.0.1:8000/). Default `false`.

- **`validate`** `Boolean`

    Whether to validate RAML schema or not.

## Deploying website to AWS S3

Using the [AWS CLI](https://aws.amazon.com/cli/):

```sh
sashay index.raml -o web
aws s3 sync ./build/ s3://your-bucket/ \
    --exclude '*' \
    --include '*.js' \
    --include '*.css' \
    --include '*.html'
```

## Publishing

1. Run `make version v=x.x.x`.
2. Create a pull request and merge.

## License

See [LICENSE](https://github.com/percolate/sashay/blob/master/LICENSE.md).
