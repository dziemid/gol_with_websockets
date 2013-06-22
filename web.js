var kBoardHeight = 40;
var kBoardWidth = 40;

var color_pattern = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
var generation = 0;

function componentToHex(c) {
    var hex = Math.floor(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = color_pattern.exec(hex.substring(0, 7));
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

    return {count: count, color: rgbToHex(r / 3, g / 3, b / 3)};
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

var randomLocation = function () {
    var x = Math.floor(5 + Math.random() * 30);
    var y = Math.floor(5 + Math.random() * 30);
    return {x: x, y: y};
}

new cronJob('43 */6 * * * *', function () {
    var loc = randomLocation();
    stateGol[loc.x - 1][loc.y - 1] = "#000000";
    stateGol[loc.x][loc.y] = "#000000";
    stateGol[loc.x + 1][loc.y] = "#000000";
    stateGol[loc.x + 1][loc.y - 1] = "#000000";
    stateGol[loc.x][loc.y + 1] = "#000000";

    notifyClientsAboutState();

}, null, true, "America/Los_Angeles");


new cronJob('13 */2 * * * *', function () {
    var loc = randomLocation();
    stateGol[loc.x - 1][loc.y] = "#000000";
    stateGol[loc.x][loc.y] = "#000000";
    stateGol[loc.x + 1][loc.y] = "#000000";

    notifyClientsAboutState();
}, null, true, "America/Los_Angeles");

new cronJob('30 * * * * *', function () {
    var loc = randomLocation();
    stateGol[loc.x][loc.y] = "#000000";
    notifyClientsAboutState();
}, null, true, "America/Los_Angeles");

var lastRun = new Date();

var shouldGoToNextGeneration = function () {
    var now = new Date();
    if (now - lastRun < 1000) {
        return false;
    } else {
        lastRun = now;
        return true;
    }
}

var goToNextGeneration = function () {
    if (shouldGoToNextGeneration) {
        generation = generation +1;
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
        notifyClientsAboutState();
    }
}

var notifyClientsAboutState = function() {
    notifyAboutState(io.sockets);
}

var notifyAboutState = function(target) {
    target.emit('news', { location: stateGol, generation: generation });
}

new cronJob('*/10 * * * * *', function () {
    goToNextGeneration();
}, null, true, "America/Los_Angeles");

new cronJob('* */3 * * * *', function () {
    goToNextGeneration();
}, null, true, "America/Los_Angeles");


io.sockets.on('connection', function (socket) {
    notifyAboutState(socket);
    socket.on('locationUpdate', function (data) {
        if (hexToRgb(data.color)) {
            stateGol[data.location.column][data.location.row] = data.color;
            io.sockets.emit('miniNews', { data: { color: data.color, column: data.location.column, row: data.location.row } });
        }
    });

});