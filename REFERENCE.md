# v1.0.x API Reference

## `sashay(options)`

### `options`

- **`destination`** `String`

    The build directory. Default `'./build/'`.

- **`output`** `String`

    The output format. Must be `'json'` or `'web'`. Default `'json'`.

- **`source`** `String`

    The source file. Must be a valid [Swagger schema](http://swagger.io/specification/), with some additional requirements for the UI. Required.

- **`watch`** `Boolean`

    Watches files for changes and rebuilds. In `'web'` mode, starts a preview server at [http://127.0.0.1:8000/](http://127.0.0.1:8000/). Default `false`.
