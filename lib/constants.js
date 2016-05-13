var os = require('os')
var path = require('path')
var util = require('util')

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
}
