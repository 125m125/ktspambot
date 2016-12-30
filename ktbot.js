/*jslint nomen: true */
/*global console, $, kt */
;
(function () {
    "use strict";
    var server = "https://kt.125m125.de/",
        users = [
            {
                uid: "5",
                tid: "5",
                tkn: "5"
            }, {
                uid: "8",
                tid: "8",
                tkn: "8"
            }, {
                uid: "9",
                tid: "9",
                tkn: "9"
            }
        ],
        interval = 0;

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

    function doTrade(item, buysell, amount) {
        kt.getPrice(item.id, function (suggestion) {
            var price = suggestion * (0.9 + Math.random() * 0.2);
            kt.createTrade(buysell, item.id, amount, price.toFixed(2), function (result) {
                var jsonResult = JSON.parse(result.response);
                $("body").prepend($("<p>").text(new Date() + " - " + (buysell ? "buy" : "sell") + " " + amount + "*" + item.name + " for " + price.toFixed(2) + " -> " + (jsonResult.success ? "success" : jsonResult.message)));
                console.log(result);
            });
        });
    }

    function createTrade(buysell, item, amount, trades) {
        var asyncCall = false;
        trades.forEach(function (entry) {
            if (entry.materialId === item.id && buysell === (entry.buy === "true")) {
                asyncCall = true;
                kt.cancelTrade(entry, function () {
                    kt.takeout(entry, function () {
                        doTrade(item, buysell, amount);
                    });
                });
            }
        });
        if (!asyncCall) {
            doTrade(item, buysell, amount);
        }
    }

    function nextIteration() {
        var user = users[Math.floor(Math.random() * users.length)];
        kt.setUser(user.uid, user.tid, user.tkn);
        kt.getItems(function (items) {

            kt.getTrades(function (trades) {
                var i, tries, item, amount, buysell;
                for (i = 0; i < 2; i += 1) {
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
                    createTrade(buysell, item, amount, trades);
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
        var time = new Date();
        interval = 60 - time.getSeconds();
        if (interval === 60) {
            interval = 0;
        }
        // start();
        nextIteration();
    });
}());