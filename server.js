let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);


var port = process.env.PORT || 3001;

http.listen(port, function () {
    console.log('listening in http://localhost:' + port);
});
var rodSetup = require('./initialRodState')

io.on('connection', (socket) => {

    socket.on('room', (room) => {
        if (io.sockets.adapter.rooms[room]) {

            if (socket.gameCode != room) {
                socket.leaveAll()
            }
            socket.join(room)
            socket.gameCode = room

            let gameState = io.sockets.adapter.rooms[room].gameState
            socket.emit('roomExists', gameState)
            // socket.emit('currentGameState', gameState)
        } else {

            socket.emit('roomDoesNotExist', room)

        }
    })

    socket.on('createNewGame', (data) => {

        socket.leaveAll()
        socket.join(data.room)
        socket.gameCode = data.room
        let newGameState = {
            room: data.room,
            description: data.description,
            mode: data.mode,
            rodsState: rodSetup.setUpInitialRodState(),
            peopleState: [],
            placesState: [],
            boxesState: [],
            objectsState: rodSetup.setUpInitialRodState(),
        }
        io.sockets.adapter.rooms[data.room].gameState = newGameState

        //this goes back to the createor of the game ... there can't be anyone else in it!
        socket.emit('newGameCreated', data.mode);
    })

    socket.on('getCurrentGameState', () => {

        if (socket.gameCode) {
            socket.emit('currentGameState', io.sockets.adapter.rooms[socket.gameCode].gameState);
        }

    })

    socket.on('objectSelected', (object) => {

        updateGameStateForSelection(socket, object)
    })

    socket.on('objectMoved', (object) => {
       
            updateGameStateForObjMoved(socket, object)
           
       
    })

    socket.on('addNewItem', (object) => {
        addNewObject(socket, object)
    })

    socket.on('itemRemoved', (object) => {
        removeObject(socket, object)
    })

    socket.on('deselectItem', ()=> {
        //this is needed so that you can rotate a rod and control when it is deselected
        console.log('deselect Rod')
        socket.to(socket.gameCode).emit('deselectRod')
    })

})

updateGameStateForSelection = function (socket, object) {

    if (socket.gameCode) {
        deselectAll(socket.gameCode)
        gameState = io.sockets.adapter.rooms[socket.gameCode].gameState
        relevantArray = ''
        switch (object.typeOfObj) {
            case "Rod":
                //there was originall here a emit rodSelected ... CHECK THIS!!!!!
                relevantArray = 'rodsState'

                break;
            case "Person":
                relevantArray = 'peopleState'
                break;
            case "Place":
                relevantArray = 'placesState'
                break;
            case "Box":
                relevantArray = 'boxesState'
                break;
            default:
        }
        // myArray = gameState[relevantArray]
        myArray = gameState.objectsState
        for (var x = 0; x < myArray.length; x++) {
            if (myArray[x].id == object.id) {
                myArray[x].selected = true
                myArray.push(myArray[x])
                myArray.splice(x, 1)
            }
            myArray[x].oldLeft = myArray[x].left
            myArray[x].oldTop = myArray[x].top
            myArray[x].oldAngle = myArray[x].angle
            // myArray[x].zIndex = object.zIndex
            
        }
        socket.to(socket.gameCode).emit('currentGameState', io.sockets.adapter.rooms[socket.gameCode].gameState)
        // socket.emit('selectedRod', object)
        // console.log(io.sockets.adapter.rooms[socket.gameCode].gameState)
    } else {
        console.log('you are not in a game room!')
    }

}

updateGameStateForObjMoved = function (socket, object) {

    if (socket.gameCode) {
        gameState = io.sockets.adapter.rooms[socket.gameCode].gameState
        relevantArray = ''
        switch (object.typeOfObj) {
            case "Rod":
                //there was originall here a emit rodSelected ... CHECK THIS!!!!!
                relevantArray = 'rodsState'
                break;
            case "Person":
                relevantArray = 'peopleState'
                break;
            case "Place":
                relevantArray = 'placesState'
                break;
            case "Box":
                relevantArray = 'boxesState'
                break;
            default:
        }

        // myArray = gameState[relevantArray]
        myArray = gameState.objectsState
        for (var w = 0; w < myArray.length; w++) {
            myArray[w].onTop = false
        }

        for (var x = 0; x < myArray.length; x++) {
            if (myArray[x].id == object.id) {
                myArray[x].left = object.left
                myArray[x].top = object.top
                myArray[x].angle = object.angle

                // myArray[x].zIndex = object.zIndex

                myArray.push(myArray[x])
                myArray.splice(x, 1)
            
                // socket.to(socket.gameCode).emit('animate', true)
                // io.in(socket.gameCode).emit('currentGameState', io.sockets.adapter.rooms[socket.gameCode].gameState)
                socket.to(socket.gameCode).emit('currentGameState', io.sockets.adapter.rooms[socket.gameCode].gameState)
                socket.emit('currentGameStateNoAnimate', io.sockets.adapter.rooms[socket.gameCode].gameState)
                return
            }

        }

    } else {
        console.log('you are not in a game room!')
    }
}


deselectAll = function (gameCode) {
    let gameState = io.sockets.adapter.rooms[gameCode].gameState
  
    for (var q = 0; q < gameState.objectsState.length; q++) {
        gameState.objectsState[q].selected = false
        // ??WARNING DO YOU NEED TO SORT OUT OLD POS SEE BELW
    }

    for (var x = 0; x < gameState.rodsState.length; x++) {
        gameState.rodsState[x].selected = false

        // ??WARNING DO YOU NEED TO SORT OUT OLD POS SEE BELW
    }
    for (var y = 0; y < gameState.placesState.length; y++) {
        gameState.placesState[y].selected = false
        // gameState.placesState[x].oldLeft = gameState.placesState[x].left
        // gameState.placesState[x].oldTop = gameState.placesState[x].top
    }
    for (var z = 0; z < gameState.peopleState.length; z++) {
        gameState.peopleState[z].selected = false
        // gameState.peopleState[x].oldLeft = gameState.peopleState[x].left
        // gameState.peopleState[x].oldTop = gameState.peopleState[x].top
    }
    for (var w = 0; w < gameState.boxesState.length; w++) {
        gameState.boxesState[w].selected = false
        // gameState.boxesState[x].oldLeft = gameState.boxesState[x].left
        // gameState.boxesState[x].oldTop = gameState.boxesState[x].top
    }
}

addNewObject = function (socket, object) {

   
    deselectAll(socket.gameCode)
    gameState = io.sockets.adapter.rooms[socket.gameCode].gameState
    switch (object.type) {
        case 'f':
            let myFemale = {
                name: object.name,
                gender: object.type,
                radius: 1,
                angle: 0,
                typeOfObj: "Person",
                left: 1,
                oldLeft: 1,
                top: 22,
                oldTop:22,
                id: "Person" + gameState.peopleState.length + 1
            }
            gameState.peopleState.push(myFemale)
            gameState.objectsState.push(myFemale)
            io.in(socket.gameCode).emit('currentGameState', gameState)
            break;
        case 'm':
            let myMale = {
                name: object.name,
                gender: object.type,
                radius: 2,
                angle: 0,
                typeOfObj: "Person",
                left: 1,
                oldLeft: 1,
                top: 20,
                oldTop: 20,
                id: "Person" + gameState.peopleState.length + 1
            }
            gameState.peopleState.push(myMale)
            gameState.objectsState.push(myMale)
            io.in(socket.gameCode).emit('currentGameState', gameState)
            break;
        case 'place':
            let myPlace = {
                name: object.name,
                gender: null,
                radius: 2,
                angle: 0,
                typeOfObj: "Place",
                left: 1,
                oldLeft: 1,
                top: 24,
                oldTop: 24,
                id: "Place" + gameState.placesState.length + 1
            }
            gameState.placesState.push(myPlace)
            gameState.objectsState.push(myPlace)
            io.in(socket.gameCode).emit('currentGameState', gameState)
            break;
        case 'box':
            let myBox = {
                name: object.name,
                gender: null,
                radius: 2,
                angle: 0,
                typeOfObj: "Box",
                left: 20,
                oldLeft: 20,
                top: 15,
                oldTop: 15,
                id: "Box" + gameState.boxesState.length + 1
            }
            gameState.boxesState.push(myBox)
            gameState.objectsState.push(myBox)

            io.in(socket.gameCode).emit('currentGameState', gameState)
        default:
    }


    removeObject = function(socket, object) {
        if (socket.gameCode) {
            gameState = io.sockets.adapter.rooms[socket.gameCode].gameState
            relevantArray = ''
            switch (object.typeOfObj) {
                case "Rod":
                    //there was originall here a emit rodSelected ... CHECK THIS!!!!!
                    relevantArray = 'rodsState'
                    break;
                case "Person":
                    relevantArray = 'peopleState'
                    break;
                case "Place":
                    relevantArray = 'placesState'
                    break;
                case "Box":
                    relevantArray = 'boxesState'
                    break;
                default:
            }
    
            // myArray = gameState[relevantArray]
    
            myArray = gameState.objectsState

            for (var i = 0; i < myArray.length; i++) {
                            if (myArray[i].id == object.id) {
                                myArray.splice(i, 1)
                               
                                io.in(socket.gameCode).emit('currentGameState', gameState)
                                return
                            }
                        }
    
        } else {
            console.log('you are not in a game room!')
        }
    }

}


