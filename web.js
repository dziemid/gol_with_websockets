var kBoardHeight= 40;
var kBoardWidth = 40;



function componentToHex(c) {
    var hex = Math.floor(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.substring(0,7));
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

var cronJob = require('cron').CronJob;

var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , express = require("express");

var emptyState = function () {
    var state = new Array(kBoardWidth);
    for (var i = 0; i < kBoardWidth; i++) {
        state[i] = new Array(kBoardHeight);
    }
    return state;
}

var countNeighbours = function (x, y) {
    var count = 0;
    var color = {};

    var r = 0;
    var g = 250;
    var b = 0;

    if (x - 1 > 0) {
        if (y - 1 > 0) {
            if (stateGol[x - 1][y - 1] != null) {
                color = hexToRgb(stateGol[x - 1][y - 1]);
                r = r + color.r;
                g = g + color.g;
                b = b + color.b;
                count = count + 1;
            }
        }
        if (stateGol[x - 1][y] != null) {
            color = hexToRgb(stateGol[x - 1][y]);
            r = r + color.r;
            g = g + color.g;
            b = b + color.b;
            count = count + 1;
        }
        if (y + 1 < kBoardHeight) {
            if (stateGol[x - 1][y + 1] != null) {
                color = hexToRgb(stateGol[x - 1][y + 1]);
                r = r + color.r;
                g = g + color.g;
                b = b + color.b;
                count = count + 1;
            }
        }
    }

    if (y - 1 > 0) {
        if (stateGol[x][y - 1] != null) {
            color = hexToRgb(stateGol[x][y - 1]);
            r = r + color.r;
            g = g + color.g;
            b = b + color.b;
            count = count + 1;
        }
    }
    if (y + 1 < kBoardHeight) {
        if (stateGol[x][y + 1] != null) {
            color = hexToRgb(stateGol[x][y + 1]);
            r = r + color.r;
            g = g + color.g;
            b = b + color.b;
            count = count + 1;
        }
    }

    if (x + 1 < kBoardWidth) {
        if (y - 1 > 0) {
            if (stateGol[x + 1][y - 1] != null) {
                color = hexToRgb(stateGol[x + 1][y - 1]);
                r = r + color.r;
                g = g + color.g;
                b = b + color.b;
                count = count + 1;
            }
        }
        if (stateGol[x + 1][y] != null) {
            color = hexToRgb(stateGol[x + 1][y]);
            r = r + color.r;
            g = g + color.g;
            b = b + color.b;
            count = count + 1;
        }
        if (y + 1 < kBoardHeight) {
            if (stateGol[x + 1][y + 1] != null) {
                color = hexToRgb(stateGol[x + 1][y + 1]);
                r = r + color.r;
                g = g + color.g;
                b = b + color.b;
                count = count + 1;
            }
        }
    }

    return {count: count, color: rgbToHex(r/3, g/3, b/3)};
}

var stateGol = emptyState();

stateGol[1][2] = "#000000";
stateGol[1][1] = "#000000";
stateGol[2][2] = "#000000";

stateGol[6][7] = "#000000";
stateGol[7][7] = "#000000";
stateGol[8][7] = "#000000";


port = process.env.PORT || 8080;

server.listen(port);

app.use(express.static('public'));
app.use(express.static('components'));

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.configure(function () {
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);
});

new cronJob('13 * * * * *', function () {
    var x = Math.floor(5 + Math.random() * 30);
    var y = Math.floor(5 + Math.random() * 30);

    stateGol[x-1][y] = "#000000";
    stateGol[x][y] = "#000000";
    stateGol[x+1][y] = "#000000";

    io.sockets.emit('news', { location: stateGol });

}, null, true, "America/Los_Angeles");


new cronJob('*/5 * * * * *', function () {

    var element = null;
    var newstate = emptyState();
    var result = {};
    for (var x = 0; x < kBoardWidth; x++) {
        for (var y = 0; y < kBoardHeight; y++) {
            result = countNeighbours(x, y);
            element = stateGol[x][y];
            if (result.count == 3 || result.count == 2 && element) {
                if (element) {
                    newstate[x][y] = element;
                } else {
                    newstate[x][y] = result.color;
                }
            }
        }
    }

    stateGol = newstate;

    io.sockets.emit('news', { location: stateGol });

}, null, true, "America/Los_Angeles");

io.sockets.on('connection', function (socket) {
    socket.emit('news', { location: stateGol });
    socket.on('locationUpdate', function (data) {
        stateGol[data.location.column][data.location.row] = data.color;
        io.sockets.emit('news', { location: stateGol });
    });

});