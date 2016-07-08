var _ = require('lodash')
var expect = require('chai').expect
var validateSchema = require('../lib/validate-schema')

var oneOf = {
    description: 'desc',
    type: 'integer',
    oneOf: [{
        type: 'integer',
    }, {
        type: 'string',
    }],
}

var allOf = {
    description: 'desc',
    type: 'integer',
    allOf: [{
        type: 'integer',
    }, {
        type: 'string',
    }],
}

var anyOf = {
    description: 'desc',
    type: 'integer',
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

function createSchema (path, optionalSchema) {
    var schema1 = _.cloneDeep(optionalSchema ? optionalSchema : schema)
    if (_.isArray(path)) {
        _.forEach(path, function (p) {
            _.unset(schema1, p)
        })
    } else {
        _.unset(schema1, path)
    }
    return schema1
}
function validatePath (path, optionalSchema) {
    expect(validateSchema.bind(undefined, createSchema(path, optionalSchema))).to.throw(/.*Missing type property.*/)
}

describe('validate-schema', function () {
    it('should run', function () {
        validateSchema(schema)
    })

    it('should validate undefined schema', function () {
        validateSchema(undefined)
    })

    it('should validate missing oneOf/allOf/anyOf type at the upper level', function () {
        validateSchema(createSchema('type', oneOf))
        validateSchema(createSchema('type', anyOf))
    })

    it('should throw different types in allOf', function () {
        expect(validateSchema.bind(undefined, createSchema('type', allOf))).to.throw(/.*Different types.*/)
    })

    it('should throw missing type property with empty schema', function () {
        expect(validateSchema.bind(undefined, {})).to.throw(/.*Missing type property.*/)
    })

    it('should validate oneOf/allOf/anyOf type and missing in one item', function () {
        validateSchema(createSchema('oneOf[0].type', oneOf))
        validateSchema(createSchema('allOf[0].type', allOf))
        validateSchema(createSchema('anyOf[0].type', anyOf))
    })

    it('should throw missing oneOf/allOf/anyOf type', function () {
        validatePath(['oneOf[1].type', 'type'], oneOf)
        validatePath(['allOf[0].type', 'type'], allOf)
        validatePath(['anyOf[1].type', 'type'], anyOf)
    })

    it('should run with oneOf', function () {
        validateSchema(oneOf)
    })

    it('should throw types[] in oneOf', function () {
        var oneOfCopy = _.cloneDeep(oneOf)
        oneOfCopy.oneOf[0].type = ['string', 'null']
        expect(validateSchema.bind(undefined, oneOfCopy)).to.throw(/`type: \[\.\.\.\]` is not supported directly inside `oneOf`/)
    })

    it('should throw nested oneOf', function () {
        var oneOfCopy = _.cloneDeep(oneOf)
        oneOfCopy.oneOf[0].oneOf = []
        expect(validateSchema.bind(undefined, oneOfCopy)).to.throw(/nested `oneOf` are not supported/)
    })

    it('should throw unsupported type in oneOf', function () {
        var oneOfCopy = _.cloneDeep(oneOf)
        oneOfCopy.oneOf[0].type = 'bogus'
        expect(validateSchema.bind(undefined, oneOfCopy)).to.throw(/bogus is not a supported type/)
    })

    it('should validate array type', function () {
        validateSchema({ type: ['string', 'integer'] })
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

    it('should throw missing patternProperties type', function () {
        validatePath('properties.b.items.patternProperties.a.type')
    })

    it('should throw an exception when an array has no items', function () {
        expect(validateSchema.bind(undefined, {
            type: 'array',
        })).to.throw()

        expect(validateSchema.bind(undefined, {
            type: 'array',
            items: [],
        })).to.throw()

        expect(validateSchema.bind(undefined, {
            type: 'array',
            items: {},
        })).to.throw()
    })

    it('should throw for unsupported type', function () {
        expect(validateSchema.bind(undefined, { type: 'bogus' })).to.throw(/bogus/)
    })

    it('should throw enum value is not string', function () {
        expect(validateSchema.bind(undefined, { type: 'string', enum: [123, 'bogus'] })).to.throw(/.*Enum value is not string.*/)
    })

    it('should throw missing title on ID property', function () {
        expect(validateSchema.bind(undefined, {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                },
            },
        })).to.throw(/.*Id property must have a title with `ID.*/)

        expect(validateSchema.bind(undefined, {
            type: 'object',
            properties: {
                uid: {
                    type: 'string',
                    title: 'my',
                },
            },
        })).to.throw(/.*Id property must have a title with `ID.*/)
    })

    it('should validate format', function () {
        validateSchema({
            type: 'object',
            properties: {
                a: {
                    type: 'string',
                    format: 'date-time',
                },
                b: {
                    type: 'string',
                    format: 'email',
                },
                c: {
                    type: 'string',
                    format: 'hostname',
                },
                d: {
                    type: 'string',
                    format: 'ipv4',
                },
                e: {
                    type: 'string',
                    format: 'ipv6',
                },
                f: {
                    type: 'string',
                    format: 'uri',
                },
                g: {
                    type: 'string',
                    format: 'legacy-date-time',
                },
            },
        })
    })

    it('should throw unsupported format', function () {
        expect(validateSchema.bind(undefined, {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                    format: 'bogus',
                },
            },
        })).to.throw(/.*Unsupported format bogus.*/)
    })
})
