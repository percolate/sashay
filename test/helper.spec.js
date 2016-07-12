var expect = require('chai').expect
var helper = require('../lib/helper')

describe('helper', function () {
    describe('getCurl()', function () {
        it('should do', function () {
            expect(helper.getCurl('http://foo.com/{bar_id}', 'POST', 'foo', {
                a: 1,
                b: true,
                c: 'Hello world',
            })).to.equal('curl http://foo.com/{bar_id} \\\n  -X POST \\\n  -H "Authorization: foo" \\\n  -H "Content-type: application/json; charset=utf-8" \\\n  -d \'EXAMPLE_REQUEST_BODY\'')
        })
    })

    describe('addRequiredQueryParameters()', function () {
        it('should do', function () {
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
    })

    describe('getSuccessResponseCodeFromMethod()', function () {
        it('should do', function () {
            expect(helper.getSuccessResponseCodeFromMethod({
                responses: {
                    300: {},
                    200: {},
                    400: {},
                }
            })).to.equal('200')
        })
    })

    describe('getSuccessResponseFromMethod()', function () {
        it('should do', function () {
            expect(helper.getSuccessResponseFromMethod({
                responses: {
                    300: {},
                    200: {
                        body: {
                            'application/json': {
                                key: 'val',
                            },
                        },
                    },
                    400: {},
                }
            })).to.deep.equal({ key: 'val' })
        })
    })
})
