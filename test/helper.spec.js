var expect = require('chai').expect
var helper = require('../lib/helper')

describe('helper', function () {
    it('should do getCurl', function () {
        expect(helper.getCurl('http://foo.com/{bar_id}', 'POST', 'foo', {
            a: 1,
            b: true,
            c: 'Hello world',
        })).to.equal('curl http://foo.com/{bar_id} \\\n  -X POST \\\n  -H "Authorization: foo" \\\n  -H "Content-type: application/json; charset=utf-8" \\\n  -d \'{example_request_body}\'')
    })

    it('should addRequiredQueryParameters', function () {
        expect(helper.addRequiredQueryParameters('http://foo.com/', {
            absoluteUri: 'bar/',
            queryParameters: [{
                required: false,
                displayName: 'scope_ids',
            },
            {
                required: true,
                displayName: 'type',
            },
            {
                required: false,
                displayName: 'fields',
            },
            ],
        })).to.equal('http://foo.com/bar/?scope_ids={scope_ids}&type={type}')
    })

    describe('mergeOneOf', function () {
        it('should merge oneOf items with base keys and concat arrays', function () {
            expect(helper.mergeOneOf({
                type: 'string',
                description: 'foo',
                enum: ['foo'],
                oneOf: [
                    { title: 'union', enum: ['bar'] },
                    { title: 'unique', enum: ['bar', 'foo'] },
                    { title: 'override', enum: 'override' },
                    { title: 'diff type', type: 'null' },
                ],
            })).to.deep.equal([{
                type: 'string',
                title: 'union',
                description: 'foo',
                enum: ['foo', 'bar'],
            }, {
                type: 'string',
                title: 'unique',
                description: 'foo',
                enum: ['foo', 'bar'],
            }, {
                type: 'string',
                title: 'override',
                description: 'foo',
                enum: 'override',
            }, {
                type: 'null',
                title: 'diff type',
                description: 'foo',
                enum: ['foo'],
            }])
        })

        it('should merge keys after oneOf as final overrides', function () {
            expect(helper.mergeOneOf({
                type: 'string',
                oneOf: [
                    { description: 'foo', title: 'foo' },
                ],
                description: 'override',
            })).to.deep.equal([{
                type: 'string',
                title: 'foo',
                description: 'override',
            }])
        })
    })

    it('should mergeAllOf', function () {
        expect(helper.mergeAllOf({
            allOf: [
                {
                    type: 'string',
                    description: 'foo',
                    enum: ['foo'],
                },
                {
                    type: 'string',
                    description: 'bar',
                    enum: ['bar'],
                },
                {
                    title: 'hi',
                    description: 'hello',
                },
            ],
        })).to.deep.equal({
            type: 'string',
            title: 'hi',
            description: 'hello',
            enum: ['foo', 'bar'],
        })
    })
})
