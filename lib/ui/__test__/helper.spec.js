var addRequiredQueryParameters = require('helper').addRequiredQueryParameters
var expect = require('chai').expect
var getCurl = require('helper').getCurl
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

    describe('getCurl', function () {
        var HTTP_BASIC_HEADER = '  -H "Authorization: Basic {base64_client_id_secret}'

        it('should support add body for post and put only', function () {
            var BODY = '  -d \'{body}\''
            expect(getCurl('example.com', 'post', ['httpBasic'])).to.contain(BODY)
            expect(getCurl('example.com', 'put', ['httpBasic'])).to.contain(BODY)
            expect(getCurl('example.com', 'get', ['httpBasic'])).to.not.contain(BODY)
        })

        it('should support httpBasic Authorization header', function () {
            expect(getCurl('example.com', 'get', ['httpBasic'])).to.contain(HTTP_BASIC_HEADER)
        })

        it('should support oauth2 Authorization header', function () {
            var AUTH_HEADER = '  -H "Authorization: Bearer {your_access_token}'
            expect(getCurl('example.com', 'get', ['oauth2'])).to.contain(AUTH_HEADER)
            expect(getCurl('example.com', 'get', ['oauth2'])).to.contain(AUTH_HEADER)
            expect(getCurl('example.com', 'get', [{ oauth2: { scopes: ['foo'] } }])).to.contain(AUTH_HEADER)
        })

        it('should only support the first securedBy', function () {
            expect(getCurl('example.com', 'get', ['httpBasic', 'oauth2'])).to.contain(HTTP_BASIC_HEADER)
        })
    })

    describe('getUrl', function () {
        it('should add required params and scope_ids regardless', function () {
            expect(addRequiredQueryParameters('example.com', 'get', {
                scope_ids: { required: false },
                type: { required: true },
                fields: { required: false },
            })).to.equal('example.com?scope_ids={scope_ids}&type={type}')
        })

        it('should only add scope_ids for GET', function () {
            expect(addRequiredQueryParameters('example.com', 'post', {
                required: false,
                displayName: 'scope_ids',
            })).to.equal('example.com')
        })

        it('should support no params', function () {
            expect(addRequiredQueryParameters('example.com', 'get')).to.equal('example.com')
        })
    })
})
