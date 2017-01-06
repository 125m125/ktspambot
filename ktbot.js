/*jslint nomen: true */
/*global console, $, Kt */
;
(function () {
    "use strict";
    var server = "https://kt.125m125.de/",
        users = [
            new Kt("2", "2", "2"), new Kt("3", "3", "3"), new Kt("4", "4", "4"), new Kt("5", "5", "5"), new Kt("6", "6", "6"), new Kt("7", "7", "7"), new Kt("8", "8", "8"), new Kt("9", "9", "9")
        ],
        interval = 0,
        tradesPerIteration = -1;

    function getUrlParameter(sParam) {
        var sPageURL = decodeURIComponent(window.location.search.substring(1)),
            sURLVariables = sPageURL.split('&'),
            sParameterName,
            i;

        for (i = 0; i < sURLVariables.length; i += 1) {
            sParameterName = sURLVariables[i].split('=');

            if (sParameterName[0] === sParam) {
                return sParameterName[1] === undefined ? true : sParameterName[1];
            }
        }
    }

    function doTrade(user, item, buysell, amount) {
        user.getRecommendedPrice(item.id, buysell, function (suggestion) {
            var price, start, end;
            if (suggestion < 0) {
                suggestion = 10;
            }
            if (buysell) {
                start = 0.95;
                end = 1 / 0.85;
            } else {
                start = 0.85;
                end = 1 / 0.95;
            }
            price = (start + Math.random() * (end - start)) * suggestion;
            user.createTrade(buysell, item.id, amount, price.toFixed(2), function (result) {
                var jsonResult = JSON.parse(result.response);
                $("body p:gt(50)").remove();
                $("body").prepend($("<p>").text(new Date() + " - " + (buysell ? "buy" : "sell") + " " + amount + "*" + item.name + " for " + price.toFixed(2) + " -> " + (jsonResult.success ? "success" : jsonResult.message)));
                console.log(result);
            });
        });
    }

    function createTrade(user, buysell, item, amount, trades) {
        var asyncCall = false;
        trades.forEach(function (entry) {
            if (entry.materialId === item.id && buysell === (entry.buy === "true")) {
                asyncCall = true;
                user.cancelTrade(entry, function () {
                    user.takeout(entry, function () {
                        doTrade(user, item, buysell, amount);
                    });
                });
            }
        });
        if (!asyncCall) {
            doTrade(user, item, buysell, amount);
        }
    }

    function nextIteration() {
        var user = users[Math.floor(Math.random() * users.length)];
        user.getItems(function (items) {
            user.getTrades(function (trades) {
                var i, tries, item, amount, buysell;
                for (i = 0; i < tradesPerIteration; i += 1) {
                    item = items[Math.floor(Math.random() * items.length)];
                    amount = Math.floor(Math.random() * 1000);
                    buysell = Math.random() >= 0.5;
                    tries = 0;
                    while (tries < 3 && (item.id === "-1" || (!buysell && item.amount < amount))) {
                        console.log("retry", item, amount);
                        item = items[Math.floor(Math.random() * items.length)];
                        amount = Math.floor(Math.random() * 1000);
                        tries += 1;
                    }
                    createTrade(user, buysell, item, amount, trades);
                }
            });
        });
    }

    function start() {
        setTimeout(function () {
            nextIteration();
            interval = getUrlParameter("delay") || 60;
            setInterval(function () {
                nextIteration();
            }, interval * 1000);
        }, interval * 1000);
    }

    document.addEventListener("DOMContentLoaded", function (event) {
        tradesPerIteration = getUrlParameter("amount") || 1;
        var time = new Date();
        interval = 60 - time.getSeconds();
        interval %= getUrlParameter("delay") || 60;
        start();
        // nextIteration();
    });
}());