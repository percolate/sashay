var expect = require('chai').expect
var validateSchema = require('../validate-schema')

describe('validate-schema', function() {
    describe('unsupported', function() {
        it('should only support objects', function() {
            expectToThrow('', /schema must be an object/)
        })
        it('should not support `not`', function() {
            expectToThrow(
                {
                    not: validSchema(),
                },
                /is not supported/
            )
        })

        it('should not support `anyOf`', function() {
            expectToThrow(
                {
                    anyOf: [validSchema()],
                },
                /is not supported/
            )
        })

        it('should not support `items: []`', function() {
            expectToThrow(
                {
                    type: 'array',
                    items: [],
                },
                /is not supported/
            )
        })
    })

    describe('allOf', function() {
        it('should validate that allOf has at least one item', function() {
            expectToThrow(
                {
                    allOf: [],
                },
                /at least one item/
            )
        })

        it('should merge and validte nested allOf', function() {
            expectToNotThrow({
                allOf: [
                    {
                        format: 'bogus',
                    },
                    {
                        allOf: [
                            {
                                type: 'integer',
                                description: 'foo',
                            },
                            {
                                // this overrides format and integer type
                                type: 'string',
                                title: 'foo',
                                format: 'uri',
                            },
                        ],
                    },
                ],
            })
        })
    })

    describe('oneOf', function() {
        it('should validate oneOf has at least one item', function() {
            expectToThrow(
                {
                    oneOf: [],
                },
                /at least one item/
            )
        })

        it('should validate that type is not an array', function() {
            expectToThrow(
                {
                    oneOf: [{ type: ['null', 'string'] }],
                },
                /not supported directly inside oneOf/,
                ['oneOf', 0]
            )
        })

        it('should validate that there is no nesting of oneOf, allOf', function() {
            expectToThrow(
                {
                    oneOf: [
                        {
                            oneOf: [validSchema()],
                        },
                    ],
                },
                /not supported directly inside oneOf/,
                ['oneOf', 0]
            )

            expectToThrow(
                {
                    oneOf: [
                        {
                            allOf: [validSchema()],
                        },
                    ],
                },
                /not supported directly inside oneOf/,
                ['oneOf', 0]
            )
        })

        it('should validate that a type is present in all oneOf', function() {
            expectToThrow(
                {
                    oneOf: [validSchema(), { description: '' }],
                },
                /type is required/,
                ['oneOf', 1]
            )

            expectToNotThrow({
                oneOf: [{ type: 'string' }, { type: 'null' }],
            })
        })

        it('should validate title and example for polymorphic objects', function() {
            expectToThrow(
                {
                    oneOf: [
                        { type: 'object' },
                        { type: 'object', title: 'bar' },
                    ],
                },
                /title is required/,
                ['oneOf', 0]
            )

            expectToThrow(
                {
                    oneOf: [
                        { type: 'object', title: 'foo' },
                        { type: 'object', title: 'bar', example: 'bar' },
                    ],
                },
                /example is required/,
                ['oneOf', 0]
            )

            expectToNotThrow({
                oneOf: [
                    { type: 'object', title: 'foo', example: {} },
                    { type: 'object', title: 'bar', example: {} },
                ],
            })

            expectToNotThrow({
                oneOf: [{ type: 'object' }, { type: 'null' }],
            })
        })

        it('should validate a well formed object', function() {
            expectToNotThrow({
                oneOf: [
                    { type: 'object', title: 'foo', example: {} },
                    { type: 'object', title: 'bar', example: {} },
                ],
            })
        })

        it('should merge oneOfs with keys in the root', function() {
            expectToNotThrow({
                type: 'object',
                title: 'foo',
                oneOf: [{ example: {} }, { example: {} }],
            })
        })
    })

    describe('object', function() {
        it('should validate types', function() {
            expectToThrow(
                {
                    type: 'object',
                    properties: {
                        bogus: { type: 'bogus' },
                    },
                },
                /invalid type/,
                ['properties', 'bogus']
            )

            expectToNotThrow({
                type: 'object',
                properties: {
                    array: { type: 'array', items: validSchema() },
                    boolean: { type: 'boolean' },
                    integer: { type: 'integer' },
                    null: { type: 'null' },
                    number: { type: 'number' },
                    object: { type: 'object' },
                    string: { type: 'string' },
                },
            })
        })

        it('should validate pattern properties', function() {
            expectToThrow(
                {
                    type: 'object',
                    patternProperties: {
                        'd+': { type: 'bogus' },
                    },
                },
                /invalid type/,
                ['patternProperties', 'd+']
            )
        })

        it('should validate format', function() {
            expectToThrow(
                {
                    type: 'object',
                    format: 'uri',
                },
                /invalid type/
            )

            expectToThrow(
                {
                    type: 'string',
                    format: 'bogus',
                },
                /invalid format/
            )

            expectToNotThrow({
                type: ['null', 'string'],
                format: 'uri',
            })

            expectToNotThrow({
                type: 'string',
                format: 'uri',
            })
        })

        it('should validate enum', function() {
            expectToNotThrow({
                type: [
                    'object',
                    'null',
                    'string',
                    'number',
                    'integer',
                    'boolean',
                ],
                enum: [null, 'foo', 1, 0.01, true, false],
            })

            expectToNotThrow({
                type: 'string',
                enum: ['foo', 'bar'],
            })

            expectToThrow(
                {
                    type: 'string',
                    enum: [null],
                },
                /does not match/
            )

            expectToThrow(
                {
                    type: 'string',
                    enum: [],
                },
                /at least one item/
            )
        })

        it('should validate examples', function() {
            expectToThrow(
                {
                    type: 'string',
                    example: 1,
                },
                /invalid example/
            )

            expectToNotThrow({
                type: 'string',
                title: 'no example',
            })

            expectToNotThrow({
                type: 'object',
                example: {
                    foo: 'bar',
                    hello: 1,
                },
                properties: {
                    foo: {
                        type: 'string',
                        enum: ['bar'],
                        example: 'bar',
                    },
                    hello: {
                        type: 'integer',
                        example: 2,
                    },
                },
            })
        })
    })

    describe('array', function() {
        it('should validate that items is defined', function() {
            expectToThrow(
                {
                    type: 'array',
                },
                /items must be defined/
            )

            expectToThrow(
                {
                    type: 'array',
                    items: {},
                },
                /items must be defined/
            )
        })

        it('should validate items', function() {
            expectToThrow(
                {
                    type: 'array',
                    items: { type: 'bogus' },
                },
                /invalid type/,
                ['items']
            )

            expectToNotThrow({
                type: 'array',
                items: validSchema(),
            })
        })
    })

    function validSchema() {
        return { type: 'null' }
    }

    function expectToThrow(schema, message, path) {
        if (!path) path = []
        var threw = false
        try {
            validateSchema(schema)
        } catch (e) {
            threw = true
            expect(e.name).to.equal('SchemaValidationError')
            expect(e.message).to.match(message)
            expect(e.path).to.have.members(path)
        }
        expect(threw).to.equal(true, 'Should have thrown an exception')
    }

    function expectToNotThrow(schema) {
        expect(validateSchema.bind(undefined, schema)).to.not.throw()
    }
})
