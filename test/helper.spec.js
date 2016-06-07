var expect = require('chai').expect
var helper = require('../lib/helper')

describe('helper', function () {
    describe('getCurl()', function () {
        it('should do', function () {
            expect(helper.getCurl('http://foo.com/{bar_id}', 'POST', 'foo', {
                a: 1,
                b: true,
                c: 'Hello world',
            })).to.equal('curl http://foo.com/{bar_id} \\\n  -X POST \\\n  -H "Authorization: foo" \\\n  -H "Content-type: application/json" \\\n  -d \'EXAMPLE_REQUEST_BODY\'')
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
})
