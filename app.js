'use strict';

/* Import dependencies */
var path = require('path');
var http = require('http');
var async = require('async');
var express = require('express');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

/* Custom dependencies */
var logger = require('./common/logger');

/* Add Middleware */
app.use(express.static(path.resolve(__dirname, 'client')));
app.use(express.bodyParser());

/* App Variables */
var stocksList = ['AAPL', 'MSFT']; // Start with stocks so the screen is not "empty"
var port = process.env.PORT || 3000;

/* Return homepage */
app.get('/', function(request, response) {
  response.render('index.html');
});

/* Route to add a new stock to monitor */
app.post('/addStock', function(req, res){
  var newStock = req.body.stock;

  // Check if stock already in the list, if not updated and sends bradcast
  if (stocksList.indexOf(newStock) > -1) {
    stocksList.push(newStock);  
    io.emit('add stock', newStock);
    res.writeHead(200);
    res.end();
  } else {
    res.writeHead(406); // 406 Not Acceptable
    res.end();
  }
});

app.delete('/:stock',function(req, res){
  var stockToRemove = req.params.user_id;

  // Check is any stock recieved to remove
  if (stockToRemove.length <1){
    res.writeHead(406); // 406 Not Acceptable
    res.end();
  }

  var index = stocksList.indexOf(stockToRemove);

  // Check if stock exists in the stock list
  if (index < 0) {
    res.writeHead(406); // 406 Not Acceptable
    res.end();
  }

  // Remove stock from list
  symbolsList.splice(index, 1);

  io.emit('remove stock', stockToRemove);
  res.writeHead(200);
  response.end();
});

io.on('connection', function(socket){
  logger.Debug('New user');
  socket.on('client update', function(){
    logger.Debug('client update');
    io.emit('client update');
  });
});
  // Listen on port 3000 by default, IP defaults to 127.0.0.1
app.listen(port, function(err){
    if (err) {
        logger.Error('Application failed to start');
        throw err;
    }
    logger.Info('Server running at http://127.0.0.1:' + port + '/');
});





