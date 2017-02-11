/* ****************************************************************** */
/* Stocks implementation                                   	  		  */
/* JS component to handle stock info gathering       		          */
/* The component will be used by main JS    	                      */
/*                                                                    */
/* date: 11/02/2017                                                   */
/* author: sergiomgaspar.dev@gmail.com                                */
/* version: 1.0                                                       */
/* ****************************************************************** */
var https = require('https');
var logger = require('../common/logger');

(function(module) {
    'use strict';

    // Exports
	module.exports.getStockDetail = getStockDetail;

    // Local Variables
	var KEY = process.env.API_KEY;

    function getStockDetail(stock){
        logger.Info('Retrieved Stock data');

        return new Promise((resolve, reject) => {
            var url = "https://www.quandl.com/api/v3/datasets/WIKI/"+stock+".json?api_key="+KEY; 
            https.get(url, (res) => {
                
                logger.Debug('statusCode:' + res.statusCode);
                var body = '';
                //logger.Debug('Dataset length:', res.body.length);
                res.on('data', (d) => {
                   body += d;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        var bodyJson = JSON.parse(body);
                        return resolve(bodyJson.dataset)
                    } else {
                        logger.Error("Could not retrieve stock info for given stock"); 
                        return reject("Could not retrieve stock info for given stock");
                    }
                });

                }).on('error', (err) => {
                    return reject(err)
                    });
        
            })
        };

})(module);
