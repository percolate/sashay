var expect = require('chai').expect
var helpers = require('components/helpers')

var HTTP_BASIC_HEADER = '  -H "Authorization: Basic {base64_client_id_secret}'

describe('components/helpers.js', function () {
    describe('getCurl', function () {
        it('should support add body for post and put only', function () {
            var BODY = '  -d \'{body}\''
            expect(helpers.getCurl('example.com', 'post', ['httpBasic'])).to.contain(BODY)
            expect(helpers.getCurl('example.com', 'put', ['httpBasic'])).to.contain(BODY)
            expect(helpers.getCurl('example.com', 'get', ['httpBasic'])).to.not.contain(BODY)
        })

        it('should support httpBasic Authorization header', function () {
            expect(helpers.getCurl('example.com', 'get', ['httpBasic'])).to.contain(HTTP_BASIC_HEADER)
        })

        it('should support oauth2 Authorization header', function () {
            var AUTH_HEADER = '  -H "Authorization: Bearer {your_access_token}'
            expect(helpers.getCurl('example.com', 'get', ['oauth2'])).to.contain(AUTH_HEADER)
            expect(helpers.getCurl('example.com', 'get', ['oauth2'])).to.contain(AUTH_HEADER)
            expect(helpers.getCurl('example.com', 'get', [{ oauth2: { scopes: ['foo'] } }])).to.contain(AUTH_HEADER)
        })

        it('should only support the first securedBy', function () {
            expect(helpers.getCurl('example.com', 'get', ['httpBasic', 'oauth2'])).to.contain(HTTP_BASIC_HEADER)
        })
    })

    describe('getUrl', function () {
        it('should add required params and scope_ids regardless', function () {
            expect(helpers.addRequiredQueryParameters('example.com', 'get', {
                scope_ids: { required: false },
                type: { required: true },
                fields: { required: false },
            })).to.equal('example.com?scope_ids={scope_ids}&type={type}')
        })

        it('should only add scope_ids for GET', function () {
            expect(helpers.addRequiredQueryParameters('example.com', 'post', {
                required: false,
                displayName: 'scope_ids',
            })).to.equal('example.com')
        })

        it('should support no params', function () {
            expect(helpers.addRequiredQueryParameters('example.com', 'get')).to.equal('example.com')
        })
    })
})
