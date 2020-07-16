// Import built-in Node.js package path.
const path = require('path');

/**
* Import the ServiceNowConnector class from local Node.js module connector.js
* and assign it to constant ServiceNowConnector. When importing local modules,
* IAP requires an absolute file reference. Built-in module path's join method
* constructs the absolute filename.
*/
const ServiceNowConnector = require(path.join(__dirname, '/connector.js'));

/**
* Import built-in Node.js package events' EventEmitter class and assign it to
* constant EventEmitter. We will create a child class from this class.
*/
const EventEmitter = require('events').EventEmitter;

/**
* The ServiceNowAdapter class.
* 
 * @summary ServiceNow Change Request Adapter
* @description This class contains IAP adapter properties and methods that IAP
*              brokers and products can execute. This class inherits the
*              EventEmitter class.
*/
class ServiceNowAdapter extends EventEmitter {

  /**
   * Here we document the ServiceNowAdapter class' callback. It must follow
   * IAP's data-first convention.
   * 
   * @callback ServiceNowAdapter~requestCallback
   * @param {(object|string)}
   *            responseData - The entire REST API response.
   * @param {error}
   *            [errorMessage] - An error thrown by REST API call.
   */

/**
  * @memberof ServiceNowAdapter
  * @constructs
  * 
  * @description Instantiates a new instance of the Itential ServiceNow Adapter.
  * @param {string}
  *            id - Adapter instance's ID.
  * @param {ServiceNowAdapter~adapterProperties}
  *            adapterProperties - Adapter instance's properties object.
  */
 constructor(id, adapterProperties) {
    // Call super or parent class' constructor.
    super();
    
    // Copy arguments' values to object properties.
    this.id   = id;
    this.props = adapterProperties;

    //log.info("\nDEBUG: In constructor, id = "+JSON.stringify(this.id)+", props = "+JSON.stringify(this.props)+"\n");
    // Previous log was for testing purpose, to see if the adapter properties displayed correctly
    // Instantiate an object from the connector.js module and assign it to an object property.
    this.connector = new ServiceNowConnector({
       url:                 this.props.url,
       username:            this.props.auth.username,
       password:            this.props.auth.password,
       serviceNowTable:     this.props.serviceNowTable
    });
 }

 /**
   * @memberof ServiceNowAdapter
   * @method connect
   * @summary Connect to ServiceNow
   * @description Complete a single healthcheck and emit ONLINE or OFFLINE.
   *      IAP calls this method after instantiating an object from the class.
   *      There is no need for parameters because all connection details were
   *      passed to the object's constructor and assigned to object property this.props.
   */
 connect(callback) {
    // As a best practice, Itential recommends isolating the health check action in its own method.
    log.info("\nDEBUG: In Connect, calling healthcheck\n");
    this.healthcheck(callback);
 }

/**
* @memberof ServiceNowAdapter
* @method healthcheck
* @summary Check ServiceNow Health
* @description Verifies external system is available and healthy.
*   Calls method emitOnline if external system is available.
*
* @param {ServiceNowAdapter~requestCallback} [callback] - The optional callback
*   that handles the response.
*/
healthcheck(callback=null) {
log.info("\nDEBUG: In healthcheck, calling getRecord\n");
let responseData, errorMessage;

this.getRecord((result, error) => {
   responseData = result;
   /**
    * For this lab, complete the if else conditional
    * statements that check if an error exists
    * or the instance was hibernating. You must write
    * the blocks for each branch.
    */
   if (error) {
     /**
      * Write this block.
      * If an error was returned, we need to emit OFFLINE.
      * Log the returned error using IAP's global log object
      * at an error severity. In the log message, record
      * this.id so an administrator will know which ServiceNow
      * adapter instance wrote the log message in case more
      * than one instance is configured.
      * If an optional IAP callback function was passed to
      * healthcheck(), execute it passing the error seen as an argument
      * for the callback's errorMessage parameter.
      */
       this.emitOffline();
       errorMessage = "Error from getRecord, id = "+this.id+": ServiceNow: Instance is unavailable.";
       log.error("\nDEBUG: Error return from getRecord: "+errorMessage+"\n");
   } else {
     /**
      * Write this block.
      * If no runtime problems were detected, emit ONLINE.
      * Log an appropriate message using IAP's global log object
      * at a debug severity.
      * If an optional IAP callback function was passed to
      * healthcheck(), execute it passing this function's result
      * parameter as an argument for the callback function's
      * responseData parameter.
      */
       this.emitOnline();
       //log.info("\nDEBUG: Normal return from getRecord, result =\n"+JSON.stringify(result)+"\n");
   }
});
if (callback) return callback(responseData, errorMessage);
}
 /**
   * @memberof ServiceNowAdapter
   * @method emitOffline
   * @summary Emit OFFLINE
   * @description Emits an OFFLINE event to IAP indicating the external system is not available.
   */
 emitOffline() {
    log.info("\nDEBUG: "+this.id+": In emitOffline: ServiceNow Instance is unavailable.");
    this.emitStatus('OFFLINE');
    log.warn(this.id+': ServiceNow: Instance is unavailable.');
 }

 /**
   * @memberof ServiceNowAdapter 
   * @method emitOnline
   * @summary Emit ONLINE
   * @description Emits an ONLINE event to IAP indicating external system is available.
   */
 emitOnline() {
    log.info("\nDEBUG: "+this.id+": In emitOnline: ServiceNow: Instance is available.");
    this.emitStatus('ONLINE');
    log.info(this.id+': ServiceNow: Instance is available.');
 }

 /**
   * @memberof ServiceNowAdapter
   * @method emitStatus
   * @summary Emit an Event
   * @description Calls inherited emit method. IAP requires the event and an
   *      object identifying the adapter instance.
   * 
   * @param {string}
   *      status - The event to emit.
   */
 emitStatus(status) {
    log.info("\nDEBUG: "+this.id+": In emitStatus: Status = "+status);
    this.emit(status, { id: this.id });
 }

/**
  * @memberof ServiceNowAdapter
  * @method changeData
  * @summary change data in responseData element e
  * @description This method copies just the required fields and changes
  *            two property names as per lab 6 instructions
  * @param    an entry of the results array to modify 
  */
changeData (e) {
    var c = {}; 
    const newKeys = ["number", "active", "priority", "description", "work_start", "work_end", "sys_id"];
    var   oldKeys = Object.keys(e);

    oldKeys.forEach (k => {
       if (newKeys.includes(k)) {
            if (k === "number")     c["change_ticket_number"] = e["number"];
            else if (k==="sys_id")  c["change_ticket_key"]    = e["sys_id"];
            else c[k] = e[k];
        }
    });

    return c;

}

 /**
   * @memberof ServiceNowAdapter
   * @method getRecord
   * @summary Get ServiceNow Record
   * @description Retrieves a record from ServiceNow.
   * 
   * @param {ServiceNowAdapter~requestCallback}
   *         callback - The callback that handles the response.
   */
 getRecord(callback) {

 let body, pBody, result, rVal, c, e, count, i;

 /**
   * Write the body for this function. 
   * The function is a wrapper for this.connector's get() method. 
   * Note how the connector was instantiated in the constructor(). 
   * get() takes a callback function.
   */
   log.info("\nDEBUG: "+this.id+": In getRecord, calling this.connector.get\n");
   this.connector.get((responseData, errorMessage) => {
          if (typeof responseData === 'object') {
            if (responseData !== null) {
                body = responseData.body;
                if (body !== null) {
                    pBody = JSON.parse(body);
                    rVal = pBody["result"];
                    if (rVal) {
                        count = rVal.length;
                        if (count > 0) {
                            for (i=0; i<count; i++) {
                                e = rVal[i];
                                rVal[i] = this.changeData(e);
                            }
                            //pBody["result"] = rVal;
                            //responseData.body = JSON.stringify(pBody);

                            responseData = rVal;

                        }
                    }
                }
            } else {
              log.error("getRecord returned error: "+errorMessage+"\n");
           }
        } else {
              log.info("getRecord: responseData is null or not an object!\n");
       }
        log.info("In getRecord, modified responseData = \n"+JSON.stringify(responseData)+"\n");
        return callback(responseData, errorMessage);
     });
 }

 /**
   * @memberof ServiceNowAdapter
   * @method postRecord
   * @summary Create ServiceNow Record
   * @description Creates a record in ServiceNow.
   * 
   * @param {ServiceNowAdapter~requestCallback}
   *            callback - The callback that handles the response.
   */
 postRecord(callback) {
  
  let body, pBody, result, rVal, c, e, count;

 /**
   * Write the body for this function. 
   * The function is a wrapper for this.connector's post() method. 
   * Note how the connector was instantiated in the constructor(). 
   * post() takes a callback function.
   */
   log.info("\nDEBUG: "+this.id+": In postRecord\n");
   this.connector.post((responseData, errorMessage) => {
        if (typeof responseData === 'object') {
            if (responseData !== null) {
               body = responseData.body;
                if (body !== null) {
                    pBody = JSON.parse(body);
                    rVal = pBody["result"];
                    if (rVal) {
                        //pBody["result"] = this.changeData(rVal);
                        //responseData.body = JSON.stringify(pBody);

                        responseData = this.changeData(rVal);
                    }
                }
            } else if (errorMessage) {
              log.info("postRecord returned error: "+errorMessage);
           }
        }
        log.info("In postRecord, modified data = "+JSON.stringify(responseData)+"\n");

        return callback(responseData, errorMessage);
     });
 }
}

module.exports = ServiceNowAdapter;
