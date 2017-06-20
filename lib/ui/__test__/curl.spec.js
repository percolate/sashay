var createElement = require('react').createElement
var expect = require('chai').expect
var Curl = require('components/curl.jsx')

var CURL_CMD = `curl "http://example.com?type={type}" \\
  -X "GET" \\
  -H "Authorization: Bearer {your_access_token}" \\
  -H "Content-type: application/json; charset=utf-8"`

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
        expect(wrapper.text()).to.equal(CURL_CMD)
    })
})
