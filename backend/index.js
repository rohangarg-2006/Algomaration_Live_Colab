require("dotenv").config();
const mongoose = require("mongoose");
const path = require('path');
const { app , io , server } = require('./config/express.config.js');
const Room = require("./models/room.model.js");

const { requireAuth } = require('./middleware/authmiddleware.js');
const authRoutes = require('./routes/routes.js');
const apiRouter = require('./routes/api.routes.js');


const joinRoomHandler = require('./socketEvents/joinRoomEvent.js');
const createRoomHandler = require('./socketEvents/createRoomEvent.js');
const startEventHandler = require('./socketEvents/startEvent.js');

app.use('/api',apiRouter);
app.use(authRoutes);


const globalMapForTeams = new Map()
const globalMapForRoundsAndDrawTime = new Map()
const globalMapForTeamScore = new Map()
const globalMapForGuessedTeams = new Map()
const globalMapForScoreMulti  = new Map()
const globalMapForRoomStatus = new Map()
const globalMapForGuessedSockets = new Map()
const globalMapForUserFromTeam = new Map()

///database
const eachRoomSetTimeoutMap = new Map();
const resolveMapForEachPromiseOfSetTimeout = new Map();
const socketIDandRoom = new Map();

let sendDataToSockets = {
    "totalOnlinePlayers": 0
}

mongoose.connect(
    process.env.MONGO_URI,
    {
      serverSelectionTimeoutMS: 5000
    }
).then(
    server.listen(3000, () => console.log("Server is running"))
).catch((err) => { console.log(err.message) })

app.get('/drawingboard', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '/public/drawingboard.html'));
})

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/aSdfGhik', (req, res) => {
    res.send({ name: req.cookies.userName });
})

app.get('/basic', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/basic.html'));
})

////////socket

io.on('connection', (socket) => {
    
    io.emit("userConnected", sendDataToSockets);
    

    socket.on('dataAdd', (roomCode, newXValues, newYValues, chartData) => {
        if (newXValues.length !== newYValues.length) {
            socket.emit('errorMessage', 'x and y data should have the same number of values.');
            return;
        }
    
        chartData.x = chartData.x.concat(newXValues);
        chartData.y = chartData.y.concat(newYValues);
    
        // Emit updated chartData to all clients
        io.to(roomCode).emit('addDataToOther', newXValues, newYValues, chartData);
    });
    
    socket.on('dataChange', (roomCode, xLabel, newYValue, chartData) => {
        const xIndex = chartData.x.indexOf(xLabel);
    
        if (xIndex === -1) {
            socket.emit('errorMessage', 'x label not found.');
            return;
        }
    
        chartData.y[xIndex] = newYValue;
    
        // Emit updated chartData to all clients
        io.to(roomCode).emit('dataChangeForOthers', xLabel, newYValue, chartData);
    });
    

    socket.on('chartData',(chartData,roomCode,type)=>{
        socket.to(roomCode).emit('DrawGraph', chartData,type);
        socket.emit('DrawGraph',chartData,type)
    })

    socket.on('changeUserRoletoEditor', (user,roomCode) => {
        socket.to(roomCode).emit('toEditor', user);
        socket.emit('toEditor', user);
        
    });


    socket.on('changeUserRoletoViewer', (user,roomCode) => {
        socket.to(roomCode).emit('toViewer', user);
        socket.emit('toViewer', user);
    });


    socket.on('leaveRoom', (roomCode) => {
        socket.leave(roomCode);
        socketIDandRoom.delete(socket.id);
        socket.emit('room left', roomCode);
    });

   
    socket.on('start',(roomCode, roomType,roomStatus) => {
        startEventHandler(roomCode,roomType,roomStatus,socket)
    });

    
    socket.on('disconnect', async () => {
        try {
           
            if(socket.id){
                const roomCodeAndMasterNameObject = socketIDandRoom.get(socket.id);
                if(roomCodeAndMasterNameObject){
                    const room = await Room.findOne({ code: roomCodeAndMasterNameObject.roomCode})
                    io.to(roomCodeAndMasterNameObject.roomCode).emit('userLeft')
                      
                let teams = globalMapForTeams.get(roomCodeAndMasterNameObject.roomCode)
                let guessedSockets  = globalMapForGuessedSockets.get(roomCodeAndMasterNameObject.roomCode)
                if(guessedSockets){
                    guessedSockets.forEach((member)=>{if(member===socket.id){
                        if(globalMapForGuessedTeams){
                            let currentValue = globalMapForGuessedTeams.get(roomCodeAndMasterNameObject.roomCode)
                            if(guessedSockets){
                                globalMapForGuessedTeams.set(roomCodeAndMasterNameObject.roomCode,currentValue-1)
                            }
                            
                        }
                       
                       
                    }})
                }

                let TeamLength
                if(teams){
                    TeamLength = Object.keys(teams).length
                }
                

                for(let i = 0;i<room.users.length;i++){
                    if(room.users[i]=== roomCodeAndMasterNameObject.master){
                        room.users.splice(i,1)
                        break
                    }
                }
                   
    
                for (let team in teams) {
                    teams[team] = teams[team].filter(socketId => socketId !== socket.id)
                    if (teams[team].length === 0) {
                        delete teams[team]
                        globalMapForTeams.set(roomCodeAndMasterNameObject.roomCode,teams)
                        TeamLength -= 1
                    }
                }
                let currentGuessedteam = globalMapForGuessedTeams.get(roomCodeAndMasterNameObject.roomCode)
                if (teams && TeamLength > 0) {
                    if((currentGuessedteam)>=(TeamLength-1)){
                        globalMapForGuessedTeams.set(roomCodeAndMasterNameObject.roomCode,0)
                        const timeoutId = eachRoomSetTimeoutMap.get(roomCodeAndMasterNameObject.roomCode);
                        if (timeoutId) {
                            clearTimeout(timeoutId);
                            const resolve = resolveMapForEachPromiseOfSetTimeout.get(timeoutId);
                            if (resolve) {
                                resolve();
                                resolveMapForEachPromiseOfSetTimeout.delete(timeoutId);
                            }
                            eachRoomSetTimeoutMap.delete(roomCodeAndMasterNameObject.roomCode);
                        }
                    }
                }else {
                    console.error("Teams object is null or undefined");
                }
               
    
                if (room) {
                    room.playerCount -= 1;
                    if (room.playerCount <= 0) {
                        await room.deleteOne();
                        socketIDandRoom.delete(socket.id);
                        globalMapForTeams.delete(roomCodeAndMasterNameObject.roomCode)
                        globalMapForTeamScore.delete(roomCodeAndMasterNameObject.roomCode)
                        globalMapForGuessedTeams.delete(roomCodeAndMasterNameObject.roomCode)
                        globalMapForRoundsAndDrawTime.delete(roomCodeAndMasterNameObject.roomCode)
                        globalMapForGuessedSockets.delete(roomCodeAndMasterNameObject.roomCode)
                        console.log(`Room with code ${roomCodeAndMasterNameObject.roomCode} deleted successfully.`);
                    }
                    else {
                        let masterToRemove = roomCodeAndMasterNameObject.master;
                        if(masterToRemove){
                            room.users = room.users.filter(master => master !== masterToRemove);
                            await room.save();
                           
                            io.to(roomCodeAndMasterNameObject.roomCode).emit('removeUser',roomCodeAndMasterNameObject.master)
                            socketIDandRoom.delete(socket.id);
                            console.log(`Removed ${roomCodeAndMasterNameObject.master} from ${roomCodeAndMasterNameObject.roomCode} successfully.`);
                        }
                       
                    }
                } else {
                    console.log(`Room with code ${roomCode} not found.`);
                }
                io.emit("userDisconnected", sendDataToSockets);
                }
                
                
            }
           
        }
        catch (err) {
            console.log("Error During disconnect,", err)
        }
    });

    socket.on('message',( message, userName, roomCode)=>{
        socket.to(roomCode).emit('addMessage',message, userName);
    })

    socket.on('joinRoom',(obj) => {
        joinRoomHandler(obj,socket);
    });

    socket.on('createRoom',(obj) => {
        createRoomHandler(obj,socket)
    });
})
console.log("wruogbew")

module.exports = {
    globalMapForTeams,
    globalMapForRoundsAndDrawTime,
    globalMapForTeamScore,
    globalMapForGuessedTeams,
    globalMapForScoreMulti,
    globalMapForRoomStatus,
    globalMapForGuessedSockets,
    globalMapForUserFromTeam,
    eachRoomSetTimeoutMap,
    resolveMapForEachPromiseOfSetTimeout,
    socketIDandRoom,
    sendDataToSockets
};
