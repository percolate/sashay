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

var SECURED_BY = {
    oauth2: { id: 'oauth2' },
    httpBasic: { id: 'httpBasic' },
    systemClient: { id: 'systemClient' },
}

var AUTH_HEADERS = {
    oauth2: { id: 'Bearer {your_access_token}' },
    httpBasic: { id: 'Basic {base64_client_id_secret}' },
    systemClient: { id: '{your_client_id}' },
}

module.exports = {
    dereferenceGlobPattern: util.format(
        '/**/schemas/**/*(%s).yaml',
        ['.example', 'item', 'list', 'object', 'post', 'put'].join('|')
    ),
    tmpDir: path.resolve(__dirname, '../../tmp'),
    types: TYPES,
    securedBy: SECURED_BY,
    authorizationHeaders: AUTH_HEADERS,
}
