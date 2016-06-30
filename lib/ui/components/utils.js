var ReactDOM = require('react-dom')

exports.isVisible = function (ref) {
    var el = ReactDOM.findDOMNode(ref)
    var rect = el.getBoundingClientRect()
    var containmentRect = {
        top: 0,
        left: 0,
        bottom: window.innerHeight || document.documentElement.clientHeight,
        right: window.innerWidth || document.documentElement.clientWidth,
    }

    var visibilityRect = {
        top: rect.top >= containmentRect.top,
        left: rect.left >= containmentRect.left,
        bottom: rect.bottom <= containmentRect.bottom,
        right: rect.right <= containmentRect.right,
    }

    return (
        visibilityRect.top &&
        visibilityRect.left &&
        visibilityRect.bottom &&
        visibilityRect.right
    )
}
