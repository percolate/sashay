var PropTypes = require('react').PropTypes

module.exports = {
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
}
