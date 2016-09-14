var createElement = require('react').createElement
var expect = require('chai').expect
var Curl = require('components/curl.jsx')

var HTTP_BASIC_HEADER = '  -H "Authorization: Basic {base64_client_id_secret}'

describe('components/curl.jsx', function () {
    it('should render', function () {
        var wrapper = this.reactMounter.mount(createElement(Curl, {
            absoluteUri: 'http://example.com',
            queryParameters: {
                scope_ids: { required: false },
                type: { required: true },
            },
            method: 'get',
            securedBy: [{ oauth2: { scopes: ['foo'] } }],
        }))
        expect(wrapper.text()).to.equal(
`curl "http://example.com?scope_ids={scope_ids}&type={type}" \\
  -X "GET" \\
  -H "Authorization: Bearer {your_access_token}" \\
  -H "Content-type: application/json; charset=utf-8"`
        )
    })

    describe('getCurl', function () {
        it('should support add body for post and put only', function () {
            var BODY = '  -d \'{body}\''
            expect(Curl._testGetCurl('example.com', 'post', ['httpBasic'])).to.contain(BODY)
            expect(Curl._testGetCurl('example.com', 'put', ['httpBasic'])).to.contain(BODY)
            expect(Curl._testGetCurl('example.com', 'get', ['httpBasic'])).to.not.contain(BODY)
        })

        it('should support httpBasic Authorization header', function () {
            expect(Curl._testGetCurl('example.com', 'get', ['httpBasic'])).to.contain(HTTP_BASIC_HEADER)
        })

        it('should support oauth2 Authorization header', function () {
            var AUTH_HEADER = '  -H "Authorization: Bearer {your_access_token}'
            expect(Curl._testGetCurl('example.com', 'get', ['oauth2'])).to.contain(AUTH_HEADER)
            expect(Curl._testGetCurl('example.com', 'get', ['oauth2'])).to.contain(AUTH_HEADER)
            expect(Curl._testGetCurl('example.com', 'get', [{ oauth2: { scopes: ['foo'] } }])).to.contain(AUTH_HEADER)
        })

        it('should only support the first securedBy', function () {
            expect(Curl._testGetCurl('example.com', 'get', ['httpBasic', 'oauth2'])).to.contain(HTTP_BASIC_HEADER)
        })
    })

    describe('getUrl', function () {
        it('should add required params and scope_ids regardless', function () {
            expect(Curl._testGetUrl('example.com', 'get', {
                scope_ids: { required: false },
                type: { required: true },
                fields: { required: false },
            })).to.equal('example.com?scope_ids={scope_ids}&type={type}')
        })

        it('should only add scope_ids for GET', function () {
            expect(Curl._testGetUrl('example.com', 'post', {
                required: false,
                displayName: 'scope_ids',
            })).to.equal('example.com')
        })

        it('should support no params', function () {
            expect(Curl._testGetUrl('example.com', 'get')).to.equal('example.com')
        })
    })
})
