var os = require('os')
var path = require('path')
var util = require('util')

var TYPES = {
    array: { id: 'array' },
    boolean: { id: 'boolean' },
    integer: { id: 'integer' },
    null: { id: 'null' },
    number: { id: 'number' },
    object: { id: 'object' },
    string: { id: 'string' },
}

module.exports = {
    dereferenceGlobPattern: util.format('/**/schemas/**/*(%s).yaml', [
        '.example',
        'item',
        'list',
        'object',
        'post',
        'put',
    ].join('|')),
    tmpDir: path.resolve(os.tmpdir(), 'sashay'),
    types: TYPES,
}
