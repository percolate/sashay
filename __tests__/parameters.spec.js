jest.unmock('../lib/ui/components/parameters.jsx')
jest.unmock('../lib/ui/components/controller.jsx')
jest.unmock('../lib/ui/components/parameters.jsx')
jest.unmock('../lib/ui/components/main.jsx')
jest.unmock('../lib/ui/components/nav.jsx')
jest.unmock('../lib/ui/components/markdown.jsx')
jest.unmock('easy-tabs')

var React = require('react')
var ReactDOM = require('react-dom')
var TestUtils = require('react-addons-test-utils')
var Parameters = require('../lib/ui/components/parameters.jsx')
var Controller = require('../lib/ui/components/controller.jsx')

var data = {
  "baseUri": "foo",
  "title": "foo",
  "version": "foo",
  "topics": [{
    "displayName": "foo",
    "contents": [{
      "type": "text",
      "text": "## Hello\n\nWorld"
    }, {
      "type": "code",
      "lang": "sh",
      "text": "curl -X GET -H \"someurl\""
    }, {
      "type": "text",
      "text": "!!!"
    }, {
      "type": "code",
      "lang": "json",
      "text": "{\n  \"key\": \"value\"\n}"
    }, {
      "type": "text",
      "text": "`\nThe extra \"`\" is intentional"
    }, {
      "type": "code",
      "lang": "sh",
      "text": "# no type"
    }],
    "slug": "topic.foo"
  }],
  "groups": [{
    "description": "My description [here](#foo.{foo_id}.post)\n1. my item in the list\n  section 1\n2. my item in the list\n  section 2\n3. my item in the list\n",
    "displayName": "foo",
    "methods": [{
      "displayName": "The foo object",
      "slug": "foo.definition",
      "body": {
        "application/json": {
          "properties": {
            "b": {
              "displayName": "b",
              "required": false,
              "type": "array",
              "items": {
                "type": ["object", null]
              },
              "properties": {
                "c": {
                  "description": "my object description",
                  "displayName": "c",
                  "required": false,
                  "type": ["string", null]
                },
                "d": {
                  "description": "a unique ID",
                  "displayName": "d",
                  "required": true,
                  "type": "integer"
                },
                "g": {
                  "enum": ["val1", "val2"],
                  "displayName": "g",
                  "required": false,
                  "type": "string"
                },
                "h": {
                  "displayName": "h",
                  "required": false,
                  "type": "array",
                  "items": {
                    "type": "string"
                  }
                },
                "oneOf": {
                  "displayName": "oneOf",
                  "required": false,
                  "type": "string"
                }
              }
            },
            "isExpandable": true,
            "description": ""
          },
          "schema": "{\n  \"type\": \"object\",\n  \"properties\": {\n    \"b\": {\n      \"type\": [\n        \"array\",\n        null\n      ],\n      \"minItems\": 1,\n      \"items\": {\n        \"type\": [\n          \"object\",\n          null\n        ],\n        \"required\": [\n          \"d\"\n        ],\n        \"additionalProperties\": false,\n        \"properties\": {\n          \"c\": {\n            \"description\": \"my object description\",\n            \"type\": [\n              \"string\",\n              null\n            ],\n            \"example\": \"firstname.lastname@percolate.com\",\n            \"format\": \"email\",\n            \"maxLength\": 100\n          },\n          \"d\": {\n            \"description\": \"a unique ID\",\n            \"type\": \"integer\",\n            \"minimum\": 10,\n            \"maximum\": 20\n          },\n          \"g\": {\n            \"enum\": [\n              \"val1\",\n              \"val2\"\n            ]\n          },\n          \"h\": {\n            \"type\": \"array\"\n          },\n          \"oneOf\": [\n            {\n              \"type\": \"object\",\n              \"properties\": {\n                \"e\": {\n                  \"type\": \"boolean\",\n                  \"default\": true\n                }\n              }\n            },\n            {\n              \"type\": \"object\",\n              \"properties\": {\n                \"f\": {\n                  \"type\": \"string\"\n                }\n              }\n            }\n          ]\n        }\n      }\n    }\n  }\n}"
        }
      }
    }],
    "slug": "method.foo"
  }]
}

var properties = {
    b: {
        displayName: 'b',
        items: {
            type: ['object', null],
        },
        required: false,
        type: 'array',
        properties: {
            c: {
                description: 'my object description',
                displayName: 'c',
                required: false,
                type: ['string', null],
            },
            d: {
                description: 'a unique ID',
                displayName: 'd',
                required: true,
                type: 'integer',
            },
            g: {
                displayName: 'g',
                enum: ['val1', 'val2'],
                required: false,
                type: 'string',
            },
            h: {
                displayName: 'h',
                items: {
                    type: 'string',
                },
                required: false,
                type: 'array',
            },
            oneOf: {
                displayName: 'oneOf',
                required: false,
                type: 'string',
            },
        },
    },
    isExpandable: true,
    description: '',
}

describe('Parameters', function () {

  it('should update offsets when displaying a nested object', function () {
      var div = document.createElement('div');
      document.body.appendChild(div);
      var controller = ReactDOM.render(<Controller {...data} />, div);
      var node = React.findDOMNode(controller);
      var links = TestUtils.scryRenderedDOMComponentsWithTag(controller, 'a')
      console.log('0 ' + JSON.stringify(node.getBoundingClientRect()))

      TestUtils.Simulate.wheel(React.findDOMNode(links[4]))
      TestUtils.Simulate.click(links[0])
      controller._updateOffsets()
      controller._updateHash()
      var ReactDOMServer = require('react-dom/server')

      var b = TestUtils.findRenderedDOMComponentWithClass(controller, 'breadcrumbs')

      TestUtils.Simulate.click(links[4])
      controller._updateOffsets()
      controller._updateHash()
      console.log(controller.state);
      console.log('1 ' + JSON.stringify(node.getBoundingClientRect()))

  });

});
