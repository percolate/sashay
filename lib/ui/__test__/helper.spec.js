var expect = require('chai').expect
var parsePayload = require('helper').parsePayload

var PAYLOAD = require('__test__/fixtures/payload.json')
var PAYLOAD_COMPLEX = require('__test__/fixtures/payload-complex.json')

describe('helper', function () {
    describe('parsePayload()', function () {
        it('should get first-level array', function () {
            expect(parsePayload([
                'object',
                0,
                'properties',
                'primary_array',
                'types',
                'array',
                0,
                'types',
            ], PAYLOAD).toJS()).to.deep.equal([
                {
                    key: 'primary_array',
                    schemaKeyPath: [
                        'object',
                        0,
                        'properties',
                        'primary_array',
                        'types',
                        'array',
                        0,
                        'types',
                    ],
                    type: 'array',
                },
            ])
        })

        it('should get second-level array', function () {
            expect(parsePayload([
                'object',
                0,
                'properties',
                'primary_array',
                'types',
                'array',
                0,
                'types',
                'object',
                0,
                'properties',
                'secondary_array',
                'types',
                'array',
                0,
                'types',
            ], PAYLOAD).toJS()).to.deep.equal([
                {
                    key: 'primary_array',
                    schemaKeyPath: [
                        'object',
                        0,
                        'properties',
                        'primary_array',
                        'types',
                        'array',
                        0,
                        'types',
                    ],
                    type: 'array',
                },
                {
                    key: 'secondary_array',
                    schemaKeyPath: [
                        'object',
                        0,
                        'properties',
                        'primary_array',
                        'types',
                        'array',
                        0,
                        'types',
                        'object',
                        0,
                        'properties',
                        'secondary_array',
                        'types',
                        'array',
                        0,
                        'types',
                    ],
                    type: 'array',
                },
            ])
        })

        it('should get first-level object', function () {
            expect(parsePayload([
                'object',
                0,
                'properties',
                'primary_object',
                'types',
            ], PAYLOAD).toJS()).to.deep.equal([
                {
                    key: 'primary_object',
                    schemaKeyPath: [
                        'object',
                        0,
                        'properties',
                        'primary_object',
                        'types',
                    ],
                    type: 'object',
                },
            ])
        })

        it('should get second-level object', function () {
            expect(parsePayload([
                'object',
                0,
                'properties',
                'primary_object',
                'types',
                'object',
                0,
                'properties',
                'secondary_object',
                'types',
            ], PAYLOAD).toJS()).to.deep.equal([
                {
                    key: 'primary_object',
                    schemaKeyPath: [
                        'object',
                        0,
                        'properties',
                        'primary_object',
                        'types',
                    ],
                    type: 'object',
                },
                {
                    key: 'secondary_object',
                    schemaKeyPath: [
                        'object',
                        0,
                        'properties',
                        'primary_object',
                        'types',
                        'object',
                        0,
                        'properties',
                        'secondary_object',
                        'types',
                    ],
                    type: 'object',
                },
            ])
        })

        it('should parse multi-type root object', function () {
            expect(parsePayload([
                'object',
                0,
                'properties',
                'object_array_a',
                'types',
                'array',
                0,
                'types',
            ], PAYLOAD_COMPLEX).toJS()).to.deep.equal([
                {
                    key: 'object_array_a',
                    schemaKeyPath: [
                        'object',
                        0,
                        'properties',
                        'object_array_a',
                        'types',
                        'array',
                        0,
                        'types',
                    ],
                    type: 'array',
                },
            ])
        })

        it('should parse multi-type root array with nested object', function () {
            expect(parsePayload([
                'array',
                0,
                'types',
                'object',
                0,
                'properties',
                'array_object_a_secondary_object',
                'types',
            ], PAYLOAD_COMPLEX).toJS()).to.deep.equal([
                {
                    key: 'array',
                    schemaKeyPath: [
                        'array',
                        0,
                        'types',
                    ],
                    type: 'array',
                },
                {
                    key: 'array_object_a_secondary_object',
                    schemaKeyPath: [
                        'array',
                        0,
                        'types',
                        'object',
                        0,
                        'properties',
                        'array_object_a_secondary_object',
                        'types',
                    ],
                    type: 'object',
                },
            ])
        })
    })
})
