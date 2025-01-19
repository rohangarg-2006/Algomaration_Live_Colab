const { io } = require('../config/express.config.js')
const Room = require("../models/room.model.js");

let globalMapForTeams;
let globalMapForRoundsAndDrawTime;
let globalMapForTeamScore;
let globalMapForGuessedTeams;
let globalMapForScoreMulti;
let globalMapForRoomStatus;
let globalMapForGuessedSockets;
let globalMapForUserFromTeam;
let eachRoomSetTimeoutMap;
let resolveMapForEachPromiseOfSetTimeout;
let socketIDandRoom;

setTimeout(() => {
    const maps = require('../index.js');
    globalMapForTeams = maps.globalMapForTeams;
    globalMapForRoundsAndDrawTime = maps.globalMapForRoundsAndDrawTime;
    globalMapForTeamScore = maps.globalMapForTeamScore;
    globalMapForGuessedTeams = maps.globalMapForGuessedTeams;
    globalMapForScoreMulti = maps.globalMapForScoreMulti;
    globalMapForRoomStatus = maps.globalMapForRoomStatus;
    globalMapForGuessedSockets = maps.globalMapForGuessedSockets;
    globalMapForUserFromTeam = maps.globalMapForUserFromTeam;
    eachRoomSetTimeoutMap = maps.eachRoomSetTimeoutMap;
    resolveMapForEachPromiseOfSetTimeout = maps.resolveMapForEachPromiseOfSetTimeout;
    socketIDandRoom = maps.socketIDandRoom;
}, process.env.IMPORT_MAPS_SETTIMEOUT_TIME); 


async function createRoomHandler (obj,socket){
    let roomCreator;
    try {
        const code = await Room.findOne({ code: obj.code })
        if (code !== null) {
            socket.emit(`responseAfterCreateRoomEvent`, [false, obj.code])
            
            return;
        }
        
        newRoom(obj,roomCreator,socket);

        socket.join(obj.code);
        socket.emit(`responseAfterCreateRoomEvent`, [true, obj.code])
        io.to(obj.code).emit('populateUserBoard',[],[roomCreator])

    }
    catch (err) {
        console.log("Error during create room : ", err);
    }
}

async function newRoom(obj,roomCreator,socket) {
    try {
        const obj2 = {
            roomCode: obj.code,
            master: obj.master
        }
        socketIDandRoom.set(socket.id, obj2);
        const newRoom = await Room.create({ name: obj.name, code: obj.code, master: obj.master, users: obj.master, playerCount: 1, roomType: "solo", slaves: obj.slaves })
        roomCreator = newRoom.users
    } catch (error) {
        if (error) {
            socket.emit(`responseAfterCreateRoomEvent`, [false, obj.code])
        }
    }
}

module.exports = createRoomHandler;