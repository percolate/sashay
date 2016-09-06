var PropTypes = require('react').PropTypes

module.exports = {
    parameterTypes: {
        formPayload: { id: 'formPayload' },
        params: { id: 'params' },
        payload: { id: 'payload' },
        query: { id: 'query' },
        response: { id: 'response' },
    },
    propTypes: {
        topics: {
            id: PropTypes.arrayOf(PropTypes.shape({
                displayName: PropTypes.string.isRequired,
                contents: PropTypes.arrayOf(
                    PropTypes.shape({
                        lang: PropTypes.string,
                        text: PropTypes.string.isRequired,
                        type: PropTypes.oneOf(['text', 'code']).isRequired,
                    })
                ),
                slug: PropTypes.string.isRequired,
            })).isRequired,
        },
    },
    values: {
        pathDelimeter: { id: '.' },
    },
}
