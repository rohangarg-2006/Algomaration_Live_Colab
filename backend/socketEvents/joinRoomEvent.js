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

async function joinRoomHandler (obj,socket) {
    io.to(obj.code).emit("userJoined")

    let newuserarray
    try {
        const room = await Room.findOne({ code: obj.code })
        if(!room || room.playerCount === 12 || globalMapForRoomStatus.get(obj.code) ==='started'){
            socket.emit("responseAfterJoinRoomEvent", [false])
        return
        }else {
            const obj2 = {
                roomCode: obj.code,
                master: obj.slaves}
            socketIDandRoom.set(socket.id, obj2);
           
            socket.join(obj.code);
            room.playerCount += 1
            room.users.push(obj.slaves)
            room.slaves.push(obj.slaves)
            await room.save()
            socket.emit('responseAfterJoinRoomEvent', [true, obj.code]);
            const newRoomjobana = await Room.findOne({ code: obj.code })
            newuserarray =  newRoomjobana.slaves
            roomMaster =  newRoomjobana.master
           
        }
    } catch (error) {
        console.log(error)
    }
    const roomCode = obj.code;
    socket.to(roomCode).emit('newUserJoinedevent', roomCode);
    io.to(obj.code).emit('populateUserBoard',newuserarray,[roomMaster])

}


module.exports = joinRoomHandler;