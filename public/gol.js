var socket = io.connect('/');

var showingFacebook = false;

var mycolor = '#'+Math.floor(Math.random()*16777215).toString(16);

var golState = new Array(1);
golState[0] = new Array(1);


function PeekabooCtrl($scope) {

    socket.on('miniNews', function (message) {
        var data = message.data;
        golState[data.column][data.row] = data.color;
        drawPiece(data.column,data.row, data.color);
    });

    socket.on('news', function (data) {
        golState = data.location;
        $scope.generationNumber = data.generation;
        $scope.$apply();

        drawBoard();
        if (showingFacebook == false) {
            showingFacebook = true;
            (function(d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s); js.id = id;
                js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=340577672736347";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        }
    });


    $scope.generationNumber = "Loading... (please wait)";
}

var kBoardWidth = 50;
var kBoardHeight= 40;
var kPieceWidth = 25;
var kPieceHeight= 25;
var kPixelWidth = 1 + (kBoardWidth * kPieceWidth);
var kPixelHeight= 1 + (kBoardHeight * kPieceHeight);

var gCanvasElement;
var gDrawingContext;

function Cell(row, column) {
    this.row = row;
    this.column = column;
}

function getCursorPosition(e) {
    /* returns Cell with .row and .column properties */
    var x;
    var y;
    if (e.pageX != undefined && e.pageY != undefined) {
        x = e.pageX;
        y = e.pageY;
    }
    else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= gCanvasElement.offsetLeft;
    y -= gCanvasElement.offsetTop;
    x = Math.min(x, kBoardWidth * kPieceWidth);
    y = Math.min(y, kBoardHeight * kPieceHeight);
    var cell = new Cell(Math.floor(y/kPieceHeight), Math.floor(x/kPieceWidth));
    return cell;
}

function halmaOnClick(e) {
    var cell = getCursorPosition(e);
    drawPiece(cell.column,cell.row, mycolor);
    socket.emit('locationUpdate', { location: cell, color: mycolor });
}

function drawBoard() {

    gDrawingContext.clearRect(0, 0, kPixelWidth, kPixelHeight);

    gDrawingContext.beginPath();

    /* vertical lines */
    for (var x = 0; x <= kPixelWidth; x += kPieceWidth) {
        gDrawingContext.moveTo(0.5 + x, 0);
        gDrawingContext.lineTo(0.5 + x, kPixelHeight);
    }

    /* horizontal lines */
    for (var y = 0; y <= kPixelHeight; y += kPieceHeight) {
        gDrawingContext.moveTo(0, 0.5 + y);
        gDrawingContext.lineTo(kPixelWidth, 0.5 +  y);
    }

    /* draw it! */
    gDrawingContext.strokeStyle = "#ccc";
    gDrawingContext.stroke();

    var length = golState.length,
        width = 0,
        element = null;
    for (var x = 0; x < length; x++) {
        width = golState[x].length
        for (var y = 0; y < width; y++) {
            color =  golState[x][y];
            if (color) {
                drawPiece(x,y, color);
            }
        }
   }
}

function drawPiece(column, row, color) {
    var x = (column * kPieceWidth) + (kPieceWidth/2);
    var y = (row * kPieceHeight) + (kPieceHeight/2);
    var radius = (kPieceWidth/2) - (kPieceWidth/10);
    gDrawingContext.beginPath();
    gDrawingContext.arc(x, y, radius, 0, Math.PI*2, false);
    gDrawingContext.closePath();
    gDrawingContext.strokeStyle = "#000";
    gDrawingContext.stroke();

    gDrawingContext.fillStyle = color;
    gDrawingContext.fill();
}


function initGame(canvasElement) {
    if (!canvasElement) {
        canvasElement = document.createElement("canvas");
        canvasElement.id = "halma_canvas";
        document.body.appendChild(canvasElement);
    }
    gCanvasElement = canvasElement;
    gCanvasElement.width = kPixelWidth;
    gCanvasElement.height = kPixelHeight;
    gCanvasElement.addEventListener("click", halmaOnClick, false);
    gDrawingContext = gCanvasElement.getContext("2d");
    drawBoard();
}

initGame(document.getElementById("myCanvas"));