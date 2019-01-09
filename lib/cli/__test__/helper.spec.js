var expect = require('chai').expect
var helper = require('../helper')

describe('helper', function() {
    describe('mergeOneOf', function() {
        it('should merge oneOf items with base keys and concat arrays', function() {
            expect(
                helper.mergeOneOf({
                    type: 'string',
                    description: 'foo',
                    enum: ['foo'],
                    oneOf: [
                        { title: 'union', enum: ['bar'] },
                        { title: 'unique', enum: ['bar', 'foo'] },
                        { title: 'override', enum: 'override' },
                        { title: 'diff type', type: 'null' },
                    ],
                })
            ).to.deep.equal([
                {
                    type: 'string',
                    title: 'union',
                    description: 'foo',
                    enum: ['foo', 'bar'],
                },
                {
                    type: 'string',
                    title: 'unique',
                    description: 'foo',
                    enum: ['foo', 'bar'],
                },
                {
                    type: 'string',
                    title: 'override',
                    description: 'foo',
                    enum: 'override',
                },
                {
                    type: 'null',
                    title: 'diff type',
                    description: 'foo',
                    enum: ['foo'],
                },
            ])
        })

        it('should merge keys after oneOf as final overrides', function() {
            expect(
                helper.mergeOneOf({
                    type: 'string',
                    oneOf: [{ description: 'foo', title: 'foo' }],
                    description: 'override',
                })
            ).to.deep.equal([
                {
                    type: 'string',
                    title: 'foo',
                    description: 'override',
                },
            ])
        })
    })

    it('should mergeAllOf', function() {
        expect(
            helper.mergeAllOf({
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
            })
        ).to.deep.equal({
            type: 'string',
            title: 'hi',
            description: 'hello',
            enum: ['foo', 'bar'],
        })
    })
})
