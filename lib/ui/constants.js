var PropTypes = require('react').PropTypes

module.exports = {
    propTypes: {
        method: PropTypes.shape({
            absoluteUri: PropTypes.string.isRequired,
            description: PropTypes.string,
            displayName: PropTypes.string.isRequired,
            formParameters: PropTypes.object,
            method: PropTypes.string.isRequired,
            queryParameters: PropTypes.object,
            securedBy: PropTypes.array,
            slug: PropTypes.string.isRequired,
            uriParameters: PropTypes.object,
        }).isRequired,
        payloadSchema: PropTypes.shape({
            array: PropTypes.arrayOf(
                PropTypes.shape({
                    types: PropTypes.object.isRequired,
                })
            ),
            object: PropTypes.arrayOf(
                PropTypes.shape({
                    properties: PropTypes.objectOf(
                        PropTypes.shape({
                            required: PropTypes.bool.isRequired,
                            types: PropTypes.object.isRequired,
                        })
                    ).isRequired,
                })
            ),
        }).isRequired,
        topics: {
            id: PropTypes.arrayOf(
                PropTypes.shape({
                    displayName: PropTypes.string.isRequired,
                    contents: PropTypes.arrayOf(
                        PropTypes.shape({
                            lang: PropTypes.string,
                            text: PropTypes.string.isRequired,
                            type: PropTypes.oneOf(['text', 'code']).isRequired,
                        })
                    ),
                    slug: PropTypes.string.isRequired,
                })
            ).isRequired,
        },
    },
    requestParameterTypes: {
        formPayload: { id: 'formPayload' },
        params: { id: 'params' },
        payload: { id: 'payload' },
        query: { id: 'query' },
    },
    values: {
        pathDelimeter: { id: '.' },
    },
}
