'use strict';

/* Import dependencies */
var path = require('path');
var http = require('http');
var async = require('async');
var express = require('express');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
//var io = require('socket.io')(server);

/* Custom dependencies */
var logger = require('./common/logger');
var stockSrv = require('./stocks');

/* Add Middleware */
app.use(express.static(path.resolve(__dirname, 'client')));
app.use(express.bodyParser());

/* App Variables */
//var currStocks = ['AAPL', 'MSFT']; // Start with stocks so the screen is not "empty"
var currStocks = ['AAPL', 'MSFT'];
var stocksList = []; // {stockId, dataset}
var port = process.env.PORT || 3000;

/* Get the stocks upon launch */
function init(){
  for (var i= 0; i<currStocks.length; i++){
    treatStock(currStocks[i]);
  }
}

/* Common function used by init and addStock */
function treatStock(currstock){

  return new Promise((resolve, reject) => {
    /* Get stock data from quandl.com */
    stockSrv.getStockDetail(currstock)
      .then( (res)=>{
        var stock = res.dataset_code;
        var index = getStockIndex(stock,stocksList);
        if ( index > -1) {
          logger.Debug('Removing old detail for stock:' + stock);
          stocksList.splice(index,1);
        }
        logger.Debug('Inserting new detail for stock:' + stock);

        var dataSeries = [];
        for (var i = 0; i < res.data.length; i++) {
          var date = Date.parse(res.data[i][0]);
          var object = [date, res.data[i][1]];  // Send value when opened session
          dataSeries.push(object);
        }

        // Sort of the array required because of Highcharts client
        dataSeries.sort(function(a, b) { 
            return a[0] > b[0] ? 1 : -1;
        });

        var dataset = {
            name: stock,
            data: dataSeries,
            tooltip: {
              valueDecimals: 2
          }
        };

        var addedStock = {
          stockId: stock,
          dataset: dataset
        };

        // New stock, push the value
        stocksList.push(addedStock);
        return resolve(addedStock);
    })
    .catch( (err) => {
      // Handle for example user asking for dummy stock
      logger.Error("Could not get stock info: "+err)
      return reject("Could not get stock info");
    });
  });
};

function getStockIndex(stock, data) {
    for (var i = 0; i < data.length; i++) {
        if (data[i] && data[i].dataset.name === stock) {
            return i;
        }
    }
    return -1;
}

/* Return homepage */
app.get('/', function(req, res) {
  res.render('index.html');
});

/* Return stocks list */
app.get('/getStocks', function(req, res) {
  logger.Debug("User requested all the stocks");
  res.writeHead(200);
  res.write(JSON.stringify(stocksList));
  res.end();
});

/* Route to add a new stock to monitor */
app.post('/addStock', function(req, res){
  treatStock(req.body.stock)
    .then((newStock)=>{
      // Stock OK: Inform users to get new stock data
      logger.Debug("Stock added, broadcast new stock available: "+newStock.stockId);
      io.emit('add stock', newStock);
      res.writeHead(200);
      res.end();
    })
    .catch((err)=>{
      // Stock KO: send error back
      res.writeHead(406); // 406 Not Acceptable
      res.end();
    });
});

app.delete('/:stock',function(req, res){
  logger.Debug("Received request to delete stock");
  var stockToRemove = req.params.stock;
  logger.Debug("Stock to remove: "+stockToRemove);
  // Check is any stock recieved to remove
  if (stockToRemove.length <1){
    logger.Error("Cannot delete stock - empty stock name");
    res.writeHead(406); // 406 Not Acceptable
    res.end();
    return;
  }

  var index = getStockIndex(stockToRemove,stocksList);
  if (index < 0) {
    logger.Error("Cannot delete stock - stock not found");
    res.writeHead(404); // 406 Not Acceptable
    res.end();
    return;
  }

  logger.Debug('Removing stock:' + stockToRemove);
  stocksList.splice(index,1);
  
  io.emit('remove stock', stockToRemove);
  res.writeHead(200);
  res.end();
});

io.on('connection', function(socket){
  logger.Debug('New user');
  socket.on('client update', function(){
    logger.Debug('client update');
    io.emit('client update');
  });
});

  // Listen on port 3000 by default, IP defaults to 127.0.0.1
server.listen(port, function(err){
    if (err) {
        logger.Error('Application failed to start');
        throw err;
    }
    logger.Info('Server running at http://127.0.0.1:' + port + '/');
    init();
});





