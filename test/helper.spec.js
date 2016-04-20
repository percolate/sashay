var expect = require('chai').expect
var helper = require('../lib/helper')

describe('helper', function () {
    describe('getCurl()', function () {
        it('should do', function () {
            expect(helper.getCurl('http://foo.com\\{bar_id}', 'POST', 'foo', {
                a: 1,
                b: true,
                c: 'Hello world',
            })).to.equal('curl http://foo.com\\BAR_ID \\\n  -X POST \\\n  -H "Authorization: foo" \\\n  -d a=1 \\\n  -d b=true \\\n  -d c="Hello world"')
        })
    })

    describe('addRequiredQueryParameters()', function () {
        it('should do', function () {
            expect(helper.addRequiredQueryParameters('http://foo.com/', {
                absoluteUri: 'bar/',
                is: [
                    'licenseScopeIds',
                ],
                queryParameters: [{
                    required: true,
                    displayName: 'type',
                },
                {
                    required: false,
                    displayName: 'fields',
                },
                ],
            })).to.equal('http://foo.com/bar/?scope_ids=license:1&type=TYPE')
        })
    })
})
