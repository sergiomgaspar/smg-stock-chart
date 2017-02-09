/* ****************************************************************** */
/* Logger                                                  	  		  */
/* Small JS component to help with logging in an APP 		          */
/* Loggs will be timestamped and dependant on env variable DEBUG 	  */
/*                                                                    */
/* date: 09/02/2017                                                   */
/* author: sergiomgaspar.dev@gmail.com                                */
/* version: 1.0                                                       */
/* ****************************************************************** */

(function(module) {
    'use strict';

	// Exports
	module.exports.Log = Log;
	module.exports.Debug = LogD;
	module.exports.Info = LogI;
	module.exports.Error = LogE;
	
	// Local Variables
	var isDebug = process.env.DEBUG || 'YES';
	
	function Log (level, logStr) {
	if (isDebug === 'YES' && level === 'D') console.log("DEBUG: " + logStr);
		else if (level === 'I') console.log("INFO: " + logStr);
		else if (level === 'E') console.log("ERROR: " + logStr);
	};

	function LogD (logStr) {
		Log('D', logStr);
	};

	function LogI (logStr) {
		Log('I', logStr);
	};
	
	function LogE (logStr) {
		Log('E', logStr);
	};

})(module);