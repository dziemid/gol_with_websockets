var cronJob = require('cron').CronJob;

var app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , express = require("express");

var emptyState = function() {
    var state = new Array(40);
    for (var i = 0; i < 40; i++) {
        state[i] = new Array(20);
    }
    return state;
}

var countNeighbours = function(x,y) {
    var count = 0;

    if (x-1 > 0) {
        if(y-1>0) {
            if (stateGol[x-1][y-1] != null) count = count + 1;
        }
        if (stateGol[x-1][y] != null) count = count + 1;
        if(y+1<20) {
            if (stateGol[x-1][y+1] != null) count = count + 1;
        }
    }

    if(y-1>0) {
        if (stateGol[x][y-1] != null ) count = count + 1;
    }
    if(y+1<20) {
        if (stateGol[x][y+1] != null ) count = count + 1;
    }

    if (x+1 < 40) {
        if(y-1>0) {
            if (stateGol[x+1][y-1] != null ) count = count + 1;
        }
        if (stateGol[x+1][y] != null ) count = count + 1;
        if(y+1<20) {
            if (stateGol[x+1][y+1] != null ) count = count + 1;
        }
    }

    return count;
}

var stateGol = emptyState();

stateGol[1][2] = "#000";
stateGol[1][1] = "#000";
stateGol[2][2] = "#000";

stateGol[6][7] = "#000";
stateGol[7][7] = "#000";
stateGol[8][7] = "#000";


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

new cronJob('*/5 * * * * *', function(){

    var element = null;
    var newstate = emptyState();
    var count = 0;
    for (var x = 0; x < 40; x++) {
        for (var y = 0; y < 20; y++) {
            count = countNeighbours(x,y);
            element =  stateGol[x][y];
            if (count == 3 || count == 2 && element) {
                if (element) {
                  newstate[x][y] = element;
                } else {
                  newstate[x][y] = "#000";
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