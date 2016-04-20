var React = require('react')
var ReactDom = require('react-dom')
var Controller = require('./components/controller.jsx')
var Prism = require('prismjs')
require('prismjs/components/prism-json')

var COLON_REPLACEMENT = 'c0lOn_123'

module.exports = function (data) {
    var el = React.createElement(Controller, data)
    ReactDom.render(el, document.getElementById('root'))
}

Prism.languages.sh = {
    string: [
        {
            pattern: /"(`?[\w\W])*?"/,
            inside: {
                function: {
                    pattern: /[^`]\$\(.*?\)/,
                    inside: {}
                }
            }
        },
    ],
    namespace: /\[[a-z][\w\W]*?\]/i,
    boolean: /\$(true|false)\b/i,
    variable: /\$\w+\b/i,
    keyword: /\b(curl|GET|POST|PUT|DELETE|Begin|Break|Catch|Class|Continue|Data|Define|Do|DynamicParam|Else|ElseIf|End|Exit|Filter|Finally|For|ForEach|From|Function|If|InlineScript|Parallel|Param|Process|Return|Sequence|Switch|Throw|Trap|Try|Until|Using|Var|While|Workflow)\b/g,
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

// Fix for json strings containing \": that causes incorrect highlighting
Prism.hooks.add('before-highlight', function (env) {
    env.code = env.code.replace(new RegExp(/\\"/, 'g'), COLON_REPLACEMENT);
})

Prism.hooks.add('after-highlight', function (env) {
    env.element.innerHTML = env.element.innerHTML.replace(new RegExp(COLON_REPLACEMENT, 'g'), '\\"');
})
