/**
 * SECURITY MANAGER
 */
var config = require('../server.properties');

module.exports = {

    /**
     * This function check the credentials stored in the configuration file geomessage.properties
     * @param credentials
     * @returns {boolean}
     */
    checkCredentials: function (credentials) {
        if (!credentials || credentials.name !== config.user || credentials.pass !== config.pass) {
            return(false);
        } else {
            return(true)
        }
    }
};
