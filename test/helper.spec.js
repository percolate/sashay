var expect = require('chai').expect
var helper = require('../lib/helper')

describe('helper', function () {
    describe('getCurl()', function () {
        it('should do', function () {
            expect(helper.getCurl('http://foo.com/', 'POST', 'foo', {
                a: 1,
                b: true,
                c: 'Hello world',
            })).to.equal('curl http://foo.com/ \\\n  -X POST \\\n  -H "Authorization: foo" \\\n  -d a=1 \\\n  -d b=true \\\n  -d c="Hello world"')
        })
    })
})
