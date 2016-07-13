var expect = require('chai').expect
var transform = require('../lib/transform-data-type')

describe('transform-data-type()', function () {
    it('should transform any scalar', function () {
        expect(transform({
            type: 'number',
            bogus: 'foo',
        })).to.deep.equal({
            number: [{
                description: undefined,
            }],
        })

        expect(transform({
            type: 'number',
            description: 'foo',
        })).to.deep.equal({
            number: [{
                description: [{
                    text: 'foo',
                    type: 'text',
                }],
            }],
        })
    })

    it('should transform a string', function () {
        expect(transform({
            type: 'string',
            description: 'hello',
            pattern: '\w+',
            enum: ['hello', 'world'],
            bogus: 'hi',
        })).to.deep.equal({
            string: [{
                description: [{
                    text: 'hello',
                    type: 'text',
                }],
                metadata: {
                    pattern: '\w+',
                    enum: ['hello', 'world'],
                },
            }],
        })
    })

    it('should transform an array of types', function () {
        expect(transform({
            type: ['number', 'null', 'string'],
        })).to.deep.equal({
            number: emptyScalar('number'),
            null: emptyScalar('null'),
            string: emptyScalar('string'),
        })
    })

    it('should transform an empty object', function () {
        expect(transform({
            type: 'object',
        })).to.deep.equal({
            object: [{
                description: undefined,
                properties: {},
            }],
        })
    })

    it('should transform an array', function () {
        expect(transform({
            type: 'array',
            items: {
                type: 'string',
            },
        })).to.deep.equal({
            array: [{
                description: undefined,
                types: { string: emptyScalar('string') },
            }],
        })
    })

    it('should transform an object with all types', function () {
        expect(transform({
            type: 'object',
            description: 'hello',
            bogus: 'hi',
            properties: {
                id: {
                    type: 'integer',
                },
                name: {
                    type: 'string',
                },
                decimal: {
                    type: 'number',
                },
                object: {
                    type: 'object',
                },
                optional: {
                    type: 'null',
                },
                list: {
                    type: 'array',
                    items: { type: 'number' },
                },
                yes_no: {
                    type: 'boolean',
                },
            },
        })).to.deep.equal({
            object: [{
                description: [{
                    text: 'hello',
                    type: 'text',
                }],
                properties: {
                    id: {
                        required: false,
                        types: { integer: emptyScalar('integer') },
                    },
                    name: {
                        required: false,
                        types: { string: emptyScalar('string') },
                    },
                    decimal: {
                        required: false,
                        types: { number: emptyScalar('number') },
                    },
                    object: {
                        required: false,
                        types: {
                            object: [{
                                description: undefined,
                                properties: {},
                            }],
                        },
                    },
                    optional: {
                        required: false,
                        types: { null: emptyScalar('null') },
                    },
                    list: {
                        required: false,
                        types: {
                            array: [{
                                description: undefined,
                                types: { number: emptyScalar('number') },
                            }],
                        },
                    },
                    yes_no: {
                        required: false,
                        types: { boolean: emptyScalar('boolean') },
                    },
                },
            }],
        })
    })

    it('should trasnform an object with required properties', function () {
        expect(transform({
            type: 'object',
            required: ['id'],
            properties: {
                id: {
                    type: 'integer',
                },
                name: {
                    type: 'string',
                },
            },
        })).to.deep.equal({
            object: [{
                description: undefined,
                properties: {
                    id: {
                        required: true,
                        types: { integer: emptyScalar('integer') },
                    },
                    name: {
                        required: false,
                        types: { string: emptyScalar('string') },
                    },
                },
            }],
        })
    })

    it('should transform polymorphic \`oneOf\`', function () {
        expect(transform({
            type: 'string',
            description: 'foo',
            enum: ['foo'],
            oneOf: [
                { title: 'union', enum: ['bar'] },
                { title: 'unique', enum: ['bar', 'foo'] },
                { title: 'override', enum: 'override' },
                { title: 'merge', pattern: '\\w+' },
                { title: 'diff type', type: 'null' },
            ],
        })).to.deep.equal({
            string: [
                {
                    title: 'abstract',
                    description: [{
                        text: 'foo',
                        type: 'text',
                    }],
                    metadata: {
                        enum: ['foo'],
                    },
                },
                {
                    title: 'union',
                    description: [{
                        text: 'foo',
                        type: 'text',
                    }],
                    metadata: {
                        enum: ['foo', 'bar'],
                    },
                }, {
                    title: 'unique',
                    description: [{
                        text: 'foo',
                        type: 'text',
                    }],
                    metadata: {
                        enum: ['foo', 'bar'],
                    },
                }, {
                    title: 'override',
                    description: [{
                        text: 'foo',
                        type: 'text',
                    }],
                    metadata: {
                        enum: 'override',
                    },
                }, {
                    title: 'merge',
                    description: [{
                        text: 'foo',
                        type: 'text',
                    }],
                    metadata: {
                        enum: ['foo'],
                        pattern: '\\w+',
                    },
                },
            ],
            null: [{
                title: 'diff type',
                description: [{
                    text: 'foo',
                    type: 'text',
                }],
            }],
        })
    })

    it('should tranforms \`oneOf\` for multiple types', function () {
        expect(transform({
            oneOf: [
                { type: 'number' },
                { type: 'null' },
            ],
        })).to.deep.equal({
            number: emptyScalar('number', 1),
            null: emptyScalar('null', 1),
        })
    })

    it('should tranforms \`allOf\`', function () {
        expect(transform({
            allOf: [
                {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string',
                        },
                        b: {
                            type: 'integer',
                        },
                    },
                },
                {
                    type: 'object',
                    properties: {
                        c: {
                            type: 'boolean',
                        },
                    },
                },
            ],
        })).to.deep.equal({
            object: [{
                description: undefined,
                properties: {
                    a: {
                        required: false,
                        types: {
                            string: [{
                                description: undefined,
                            }],
                        },
                    },
                    b: {
                        required: false,
                        types: {
                            integer: [{
                                description: undefined,
                            }],
                        },
                    },
                    c: {
                        required: false,
                        types: {
                            boolean: [{
                                description: undefined,
                            }],
                        },
                    },
                },
            }],
        })
    })

    it('should tranforms multiple types in \`allOf\`', function () {
        expect(transform({
            allOf: [
                {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string',
                        },
                    },
                },
                {
                    type: ['object', 'null'],
                    properties: {
                        c: {
                            type: 'number',
                        },
                    },
                },
            ],
        })).to.deep.equal({
            null: [{
                description: undefined,
            }],
            object: [{
                description: undefined,
                properties: {
                    a: {
                        required: false,
                        types: {
                            string: [{
                                description: undefined,
                            }],
                        },
                    },
                    c: {
                        required: false,
                        types: {
                            number: [{
                                description: undefined,
                            }],
                        },
                    },
                },
            }],
        })
    })

    it('should tranforms nested \`allOf\`', function () {
        expect(transform({
            allOf: [
                {
                    description: 'my desc',
                    type: 'object',
                    properties: {
                        a: {
                            type: 'string',
                        },
                    },
                },
                {
                    allOf: [{
                        type: 'object',
                        properties: {
                            b: {
                                type: 'integer',
                            },
                        },
                    },
                    {
                        type: 'object',
                        properties: {
                            c: {
                                type: 'integer',
                            },
                        },
                    }],
                },
            ],
        })).to.deep.equal({
            object: [{
                description: [{
                    text: 'my desc',
                    type: 'text',
                }],
                properties: {
                    a: {
                        required: false,
                        types: {
                            string: [{
                                description: undefined,
                            }],
                        },
                    },
                    b: {
                        required: false,
                        types: {
                            integer: [{
                                description: undefined,
                            }],
                        },
                    },
                    c: {
                        required: false,
                        types: {
                            integer: [{
                                description: undefined,
                            }],
                        },
                    },
                },
            }],
        })
    })

    it('should extract examples', function () {
        expect(transform({
            type: 'object',
            example: 'example1',
            properties: {
                a: {
                    type: 'string',
                    example: 'example2',
                },
            },
        })).to.deep.equal({
            object: [{
                description: undefined,
                example: '\"example1\"',
                properties: {
                    a: {
                        required: false,
                        types: {
                            string: [{
                                description: undefined,
                                example: 'example2'
                            }]
                        }
                    }
                }
            }]
        })
    })
})


function emptyScalar (type, subTypeNumber) {
    var formatted = { description: undefined }

    if (subTypeNumber) {
        formatted.title = `Subtype ${subTypeNumber}`
    }

    return [formatted]
}
