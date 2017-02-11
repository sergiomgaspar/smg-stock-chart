/* ****************************************************************** */
/* smg-stock-charts FrontEnd JS                             	  		  */
/* Javascript (angular) code to handle stock charts     		          */
/*                                                                    */
/* date: 11/02/2017                                                   */
/* author: sergiomgaspar.dev@gmail.com                                */
/* version: 1.0                                                       */
/* ****************************************************************** */
var socket = io();

/* Using highcharts.com */
angular.module("stocksChartApp", ['ngRoute', 'highcharts-ng'])

	.config(function($routeProvider) {

		$routeProvider
			.when("/", {
				/* Use template to segment code */
				templateUrl: "smg-stocks.html",
				controller: "stocksController",
			});
	})

	/* Angular services to: Get all stocks + add a stock + remove a stock */
	.service("Stocks", function($http) {

		this.GetStocksList = function() {
			console.log("Getting stocks list");
			return $http.get('getStocks');
		};

		// Adds a stock in the server (SocketIO will emit when done)
		this.addStock = function(query) {
			return $http.post('addStock', {
				stock: query
			});
		};

		// Remove a stock from server (SocketIO will emit when done)
		this.removeStock = function(query) {
			return $http.delete(query);
		};
	})

	.controller("stocksController", function($scope, Stocks) {

		/* Retrieve all stocks from the BE */
		Stocks.GetStocksList()
			.then(function(res) {
				console.log("retrieved stocks list");

				var stocksJson = res.data;
				console.log("SIZE: " + stocksJson.length);

				// Need to parse result because server added 
				var dataset = [];
				for (var i = 0; i < stocksJson.length; i++) {
					dataset.push(stocksJson[i].dataset);
				};
				$scope.stocks = dataset;
				$scope.selectedRow = -1;
				$scope.selectedStock = '';

				// Create a list of stocks names to present to user
				$scope.stockList = $scope.stocks.map(function(value, index) {
					return value.name;
				});

				// chart config.. "standard"
				$scope.chartConfig = {
					options: {
						chart: {
							zoomType: 'x'
						},
						rangeSelector: {
							enabled: true,
							selected: 4
						},
						navigator: {
							enabled: true,
							series: $scope.stocks
						}
					},
					series: $scope.stocks,
					title: {
						text: 'SMG-Stock-Chart'
					},
					subtitle: {
						text: 'Stock chart APP done for FCC'
					},

					useHighStocks: true,
				};

			}, function(response) {
				console.log("Could not retrieve stocks data");
			});

		/* Handle broadcast event to add a stock */
		socket.on('add stock', function(res) {
			console.log("Received request to add a stock")
			$scope.selectedRow = -1;
			$scope.selectedStock = '';
			if (res.length === 0) {
				$scope.$apply(function() {
					$scope.nostockfound = "Stock information could not be retreived, please try again!";
				});
			} else {
				$scope.$apply(function() {
					$scope.nostockfound = "";
					console.log("Updating graph")

					$scope.chartConfig.series.push(res.dataset);
					$scope.stockList.push(res.dataset.name);
				});
			}
		});

		/* Executed when user requests a new stock by name */
		$scope.addStock = function(stockToAdd) {

			console.log("Adding stock: " + stockToAdd);
			Stocks.addStock(stockToAdd);
		};

		$scope.rowSelected = function(index) {
			$scope.selectedRow = index;
			$scope.selectedStock = $scope.stocks[index].name;
		};

		/* Executed with stock selected */
		$scope.removeStock = function(stockName) {
			console.log("Removing stock: " + stockName);
			Stocks.removeStock(stockName)
				.then(function(res) {
					console.log("Stock removed from server");
				}, function(res) {
					console.log("Could not remove stock from server");
				});
		};

		/* Handle broadcast to remove stock */
		socket.on('remove stock', function(res) {
			console.log("Received request to remove stock: " + res);

			$scope.$apply(function() {
				var index = $scope.stockList.indexOf(res);
				if (index < 0) return; // Failsafe

				$scope.stockList.splice(index, 1);
				$scope.selectedRow = -1;
				$scope.selectedStock = '';
				$scope.chartConfig.series.splice(index, 1);
			});

		});

	});