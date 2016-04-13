var _ = require('lodash')
var util = require('util')
var Prism = require('prismjs')
require('prismjs/components/prism-json')

var SUCCESS_CODE_RE = /^2\d{2}/

exports.SUCCESS_CODE_RE = SUCCESS_CODE_RE
exports.getCurl = getCurl
exports.getSuccessResponseFromMethod = getSuccessResponseFromMethod

function getCurl (absoluteUri, method, apiKey, data) {
    return [
        util.format('curl %s \\', absoluteUri),
        util.format('  -X %s \\', method),
        util.format('  -H "Authorization: %s" \\', apiKey),
    ]
    .concat(_.map(data, function (val, key) {
        return util.format('  -d %s=%s \\', key, _.isString(val) ? util.format('"%s"', val) : val)
    }))
    .join('\n')
    .replace(/ \\$/, '')
}

function getSuccessResponseFromMethod (obj) {
    return _.chain(obj)
        .get([
            'responses',
        ])
        .find(function (val, key) {
            return key.match(SUCCESS_CODE_RE)
        })
        .get([
            'body',
            'application/json',
        ])
        .value()
}

Prism.languages.sh = {
    string: [
        {
            pattern: /"(`?[\w\W])*?"/,
            inside: {
                "function": {
                    pattern: /[^`]\$\(.*?\)/,
                    inside: {}
                }
            }
        },
    ],
    namespace: /\[[a-z][\w\W]*?\]/i,
    boolean: /\$(true|false)\b/i,
    variable: /\$\w+\b/i,
    keyword: /\b(curl|GET|POST|PUT|DELETE|Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Exit|Filter|Finally|For|ForEach|From|Function|If|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/i,
    operator: {
        pattern: /(\W?)(!|-(eq|ne|gt|ge|lt|le|sh[lr]|not|b?(and|x?or)|(Not)?(Like|Match|Contains|In)|Replace|Join|is(Not)?|as|-d)\b|-[-=]?|\+[+=]?|[*\/%]=?)/i,
        lookbehind: true
    },
    property: /\w+(?==)/i,
    punctuation: /[|{}[\];(),.]/
};

Prism.languages.http = {
    keyword: /\b(curl|GET|POST|PUT|DELETE)\b/g,
}
