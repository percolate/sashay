var _ = require('lodash')
var expect = require('chai').expect
var validateType = require('../lib/validate-type')

var oneOf = {
    description: 'desc',
    oneOf: [{
        type: 'integer',
    }, {
        type: 'string',
    }],
}

var allOf = {
    description: 'desc',
    allOf: [{
        type: 'integer',
    }, {
        type: 'string',
    }],
}

var anyOf = {
    description: 'desc',
    anyOf: [{
        type: 'integer',
    }, {
        type: 'string',
    }],
}

var schema = {
    type: 'object',
    properties: {
        b: {
            type: [
                'array',
                null,
            ],
            items: {
                type: [
                    'object',
                    null,
                ],
                patternProperties: {
                    a: {
                        description: 'Filter by FIELD date (inclusive) (ex. `created_at:from=2016-03-02 00:38:00`)',
                        type: 'string',
                    },
                },
                properties: {
                    c: {
                        description: 'my object description',
                        type: [
                            'string',
                            null,
                        ],
                    },
                    d: {
                        type: 'array',
                        items: [{
                            type: 'string',
                            description: 'object1',
                        }, {
                            type: 'integer',
                            description: 'object2',
                        }],
                    },
                },
                oneOf: [{
                    type: 'object',
                    properties: {
                        e: {
                            type: 'boolean',
                            default: true,
                        },
                    },
                }, {
                    type: 'object',
                    properties: {
                        f: {
                            type: 'string',
                        },
                    },
                }],
            },
        },
    },
}

function validatePath (path, optionalSchema) {
    var schema1 = _.cloneDeep(optionalSchema ? optionalSchema : schema)
    if (_.isArray(path)) {
        _.forEach(path, function (p) {
            _.unset(schema1, p)
        })
    } else {
        _.unset(schema1, path)
    }
    expect(validateType.bind(undefined, schema1)).to.throw(/.*Missing type property.*/)
}

describe('validate-schema', function () {
    it('should run', function () {
        validateType(schema)
    })

    it('should validate undefined schema', function () {
        validateType(undefined)
    })

    it('should validate mising oneOf/allOf/anyOf type at the upper level', function () {
        validateType(oneOf)
        validateType(allOf)
        validateType(anyOf)
    })

    it('should run with oneOf', function () {
        validateType(oneOf)
    })

    it('should throw missing object type', function () {
        validatePath('type')
    })

    it('should throw missing items array type', function () {
        validatePath('properties.b.items.properties.d.items[0].type')
    })

    it('should throw missing items object type', function () {
        validatePath(['properties.b.items.type', 'properties.b.items.oneOf'])
    })

    it('should throw missing scalar type', function () {
        validatePath('properties.b.items.properties.c.type')
    })

    it('should throw missing oneOf type', function () {
        validatePath('properties.b.items.oneOf[0].type')
    })

    it('should throw missing allOf type', function () {
        validatePath('allOf[0].type', allOf)
    })

    it('should throw missing anyOf type', function () {
        validatePath('anyOf[1].type', anyOf)
    })

    it('should throw missing patternProperties type', function () {
        validatePath('properties.b.items.patternProperties.a.type')
    })
})
