const request = require('request');

const validResponseRegex = /(2\d\d)/;

/**
* The ServiceNowConnector class.
*
* @summary ServiceNow Change Request Connector
* @description This class contains properties and methods to execute the
*   ServiceNow Change Request product's APIs.
*/
class ServiceNowConnector {
 /**
   * @memberof ServiceNowConnector
   * @constructs
   * @description Copies the options parameter to a public property for use by class methods.
   *
   * @param {object} options               - API instance options.
   * @param {string} options.url           - Your ServiceNow Developer instance's URL.
   * @param {string} options.username             - Username to your ServiceNow instance.
   * @param {string} options.password             - Your ServiceNow user's password.
   * @param {string} options.serviceNowTable       - The table target of the ServiceNow table API.
   */
 constructor(options) {
    this.options = options;
 }
  
  /**
   * @memberof ServiceNowConnector
   * 
   * @method isHibernating
   * 
   * @description           - Checks if request function responded with evidence of a hibernating ServiceNow instance.
   * 
   * @param {object}
   *            response     - The response argument passed by the request function in its callback.
   * 
   * @return {boolean}              - Returns true if instance is hibernating. Otherwise returns false.
   */
 isHibernating(response) {
    return    response.body.includes('Instance Hibernating page')       && 
              response.body.includes('<html>')    && 
              response.statusCode === 200;
 }


 /**
   * @memberof ServiceNowConnector
   * 
   * @method processRequestResults
   * 
   * @description Inspect ServiceNow API response for an error, bad response code,
   *              or a hibernating instance. If any of those conditions are
   *              detected, return an error. Else return the API's response.
   * 
   * @param {error}
   *            error               - The error argument passed by the request function in its callback.
   * @param {object}
   *            response     - The response argument passed by the request function in its callback.
   * @param {string}
   *            body         - The HTML body argument passed by the request function in its callback.
   * @param {iapCallback}
   *            callback     - Callback a function.
   * @param {(object|string)}
   *            callback.data - The API's response. Will be an object if sunnyday
   *            path. Will be HTML text if hibernating instance.
   * @param {error}
   *            callback.error - The error property of callback.
   */
 processRequestResults(error, response, body, callback) {

    let callbackError = null;
    let callbackData  = null;
    let requestType   = response.request.method;
    /**
     * You must build the contents of this function. Study your package and note
     * which parts of the get() and post() functions evaluate and respond to
     * data and/or errors the request() function returns. This function must not
     * check for a hibernating instance; it must call function isHibernating.
     */
     if (error) {
       log.error('\nError returned from '+requestType+' request:\nError present. ');   //
        callbackError = error;
     } else if (!validResponseRegex.test(response.statusCode)) {
        log.error('\nError returned from '+requestType+' request:\nBad response code. ');//
        callbackError = response;
     } else if (this.isHibernating(response)) {
        callbackError = 'Service Now instance is hibernating. ';
        log.error('\nError returned from '+requestType+' request:\n');//
     } else {
       log.info('\nResponse returned from '+requestType+' request:\n'); //
        callbackData = response;
     }
     return callback(callbackData, callbackError);
 }


 /**
   * @memberof ServiceNowConnector
   * 
   * @method constructUri
   * 
   * @description Build and return the proper URI by appending an optionally
   *              passed [URL query string]{@link https://en.wikipedia.org/wiki/Query_string}.

   * 
   * @param {string}
   *            serviceNowTablename - The table target of the ServiceNow table API.
   * @param {string}
   *            [query] - Optional URL query string.
   * 
   * @return {string} ServiceNow URL
   */
 constructUri(serviceNowTablename, query = null) {
    let uri = `/api/now/table/`+ serviceNowTablename; //${serviceNowTablename}
    if (query) {
      uri = uri + '?' + query;
    }
    return uri;
 }

 /**
   * 
   * @memberof ServiceNowConnector
   * 
   * @method sendRequest 
   *
   * @description Builds final options argument for request function from global
   *              const options and parameter callOptions. Executes request call,
   *              then verifies response.
   * 
   * @param {object}
   *            callOptions - Passed call options.
   * @param {string}
   *            callOptions.query - URL query string.
   * @param {string}
   *            callOptions.serviceNowTable - The table target of the
   *            ServiceNow table API.
   * @param {string}
   *            callOptions.method - HTTP API request method.
   * @param {iapCallback}
   *            callback - Callback a function.
   * @param {(object|string)}
   *            callback.data - The API's response. Will be an object if sunnyday
   *            path. Will be HTML text if hibernating instance.
   * @param {error}
   *            callback.error - The error property of callback.
   */
 sendRequest(callOptions, callback) {
    // Initialize return arguments for callback
    let processedResults     = null;
    let processedError              = null;

    const requestOptions = {
           method: callOptions.method,
           auth: {
             user: this.options.username,
             pass: this.options.password,
           },
           baseUrl: this.options.url,
           uri : this.constructUri(this.options.serviceNowTable, callOptions.query)
    };
    request(requestOptions, (error, response, body) => {
           this.processRequestResults(error, response, body, (processedResults, processedError) => callback(processedResults, processedError))
    });
 }

 /**
   * @memberof ServiceNowConnector
   * 
   * @method post
   * @description Call the ServiceNow POST API. Sets the API call's method, then
   *              calls sendRequest().
   * 
   * @param {object}
   *            callOptions - Passed call options.
   * @param {string}
   *            callOptions.serviceNowTable - The table target of the ServiceNow table API.
   * @param {iapCallback}
   *            callback - Callback a function.
   * @param {(object|string)}
   *            callback.data - The API's response. Will be an object if sunnyday
   *            path. Will be HTML text if hibernating instance.
   * @param {error}
   *            callback.error - The error property of callback.
   */
 post(callback) {
           let postCallOptions = {
                     url:           this.options.url,
                     username:     this.options.username,
                     password:     this.options.password,
                     serviceNowTable: this.options.serviceNowTable
           };
           postCallOptions.method = 'POST';
           postCallOptions.query  = null;
           this.sendRequest(postCallOptions, (results, error) => callback(results, error));
 }

 /**
   * @memberof ServiceNowConnector
   * 
   * @method get
   * @summary Calls ServiceNow GET API
   * @description Call the ServiceNow GET API. Sets the API call's method and query,
   *   then calls this.sendRequest(). In a production environment, this method
   *   should have a parameter for passing limit, sort, and filter options.
   *   We are ignoring that for this course and hardcoding a limit of one.
   *
   * @param {iapCallback} callback - Callback a function.
   * @param {(object|string)} callback.data - The API's response. 
   *        Will be an object if sunnyday path. Will be HTML text if hibernating instance.
   * @param {error} callback.error - The error property of callback.
   */
  
  get(callback) {
    let getCallOptions = {
              url:          this.options.url,
              username:     this.options.username,
              password:     this.options.password,
              serviceNowTable: this.options.serviceNowTable
    };
    getCallOptions.method = 'GET';
    getCallOptions.query  = 'sysparm_limit=3';
    this.sendRequest(getCallOptions, (results, error) => callback(results, error));
 }
}

module.exports = ServiceNowConnector;
