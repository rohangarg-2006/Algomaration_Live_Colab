const { io } = require('../config/express.config.js')

let globalMapForTeams;
let globalMapForRoundsAndDrawTime;
let globalMapForTeamScore;
let globalMapForGuessedTeams;
let globalMapForScoreMulti;
let globalMapForRoomStatus;
// let globalMapForGuessedSockets;
let globalMapForUserFromTeam;
let eachRoomSetTimeoutMap;
let resolveMapForEachPromiseOfSetTimeout;
let socketIDandRoom;
const typeOfWordArray = ["eAppliances","vehicles","random1","random2","random3","random4"];

setTimeout(() => {
    const maps = require('../index.js');
    globalMapForTeams = maps.globalMapForTeams;
    globalMapForRoundsAndDrawTime = maps.globalMapForRoundsAndDrawTime;
    globalMapForTeamScore = maps.globalMapForTeamScore;
    globalMapForGuessedTeams = maps.globalMapForGuessedTeams;
    globalMapForScoreMulti = maps.globalMapForScoreMulti;
    globalMapForRoomStatus = maps.globalMapForRoomStatus;
    // globalMapForGuessedSockets = maps.globalMapForGuessedSockets;
    globalMapForUserFromTeam = maps.globalMapForUserFromTeam;
    eachRoomSetTimeoutMap = maps.eachRoomSetTimeoutMap;
    resolveMapForEachPromiseOfSetTimeout = maps.resolveMapForEachPromiseOfSetTimeout;
    socketIDandRoom = maps.socketIDandRoom;
}, process.env.IMPORT_MAPS_SETTIMEOUT_TIME); 

async function startEventHandler (roomCode,roomType,roomStatus){

    globalMapForRoomStatus.set(roomCode,roomStatus)
   
    if(globalMapForRoundsAndDrawTime.get(roomCode)[0]){
        globalMapForScoreMulti.set(roomCode,globalMapForRoundsAndDrawTime.get(roomCode)[0])
    }
   
   let clearintervalID  = setInterval(() => {
    let currentValue = globalMapForScoreMulti.get(roomCode);
    if( currentValue/1000 >= 0 ){
        io.to(roomCode).emit('timerUpdate',currentValue/1000)
    }
   
    if(currentValue/1000 <= 10 && currentValue/1000 > 0 ){
        io.to(roomCode).emit('timeRunningout')
    }
  globalMapForScoreMulti.set(roomCode, currentValue - 1000);
}, 1000);
    await makingTeams(roomCode, roomType);
    io.to(roomCode).emit('showUserScore',globalMapForUserFromTeam.get(roomCode),globalMapForTeamScore.get(roomCode))
    const teams = globalMapForTeams.get(roomCode)

     if( globalMapForRoundsAndDrawTime && globalMapForRoundsAndDrawTime.get(roomCode)){
        if(Array.isArray(globalMapForRoundsAndDrawTime.get(roomCode)) && globalMapForRoundsAndDrawTime.get(roomCode)[1] && globalMapForRoundsAndDrawTime.get(roomCode).length > 1){
            for (let i = 1; i <= globalMapForRoundsAndDrawTime.get(roomCode)[1]; i++) {
                for (let team in teams) {
                    await startRound(teams, team, roomCode)
                    console.log('roundover')
                  
                }
                if(!globalMapForRoundsAndDrawTime.get(roomCode)){
                    break
                }
            }
            console.log('gameover')
        }
     }
    
    let max = 0
    let winnerTeam = null
    let teamsTobeWin = globalMapForTeamScore.get(roomCode)
    if(teamsTobeWin){
        for (candidates in teamsTobeWin){
            if(candidates){
                if(teamsTobeWin[candidates]>max){
                    max = teamsTobeWin[candidates]
                    winnerTeam = candidates
                } 
            }
           
        }
        if(winnerTeam){
            if(globalMapForUserFromTeam){
                io.to(roomCode).emit('winnerTeam',globalMapForUserFromTeam.get(roomCode)[winnerTeam])
                console.log('winner',globalMapForUserFromTeam.get(roomCode)[winnerTeam])
                clearInterval(clearintervalID)
            }
           
        }    
    }   
}

async function startRound(teams, team, roomCode) {
    return new Promise(async (resolve, reject) => {
        let userObj  = globalMapForUserFromTeam.get(roomCode)
        io.to(roomCode).emit('showDrawer',userObj[team])
        await pauseForScoreUpdatation(600)
        io.to(roomCode).emit('clearCanvas')
        if(teams && teams[team]){
            teams[team].forEach((socketId) => {
                io.to(socketId).emit("changeUserState");
            })
        }
        await fetchWords (roomCode)
        if(globalMapForRoundsAndDrawTime.get(roomCode)){
            if(globalMapForRoundsAndDrawTime.get(roomCode)[0]){
                const promise = pause(globalMapForRoundsAndDrawTime.get(roomCode)[0])
            eachRoomSetTimeoutMap.set(roomCode, promise.timeoutId);
            await promise
            }
        }
        
        let userObj2  = globalMapForUserFromTeam.get(roomCode)
        io.to(roomCode).emit('turnOver',userObj2)
        await pauseForScoreUpdatation(2000)
        io.to(roomCode).emit('clearCanvas')
        
        
        if(teams && teams[team]){
            teams[team].forEach((socketId) => {
                io.to(socketId).emit("changeUserState");
            })
        }
        io.to(roomCode).emit("showTheWordwehadToguess")
        if(globalMapForRoundsAndDrawTime && globalMapForRoundsAndDrawTime.get(roomCode)){
            if(Array.isArray(globalMapForRoundsAndDrawTime.get(roomCode))&&globalMapForRoundsAndDrawTime.get(roomCode)[0]&& globalMapForRoundsAndDrawTime.get(roomCode).length > 1){
                globalMapForScoreMulti.set(roomCode,globalMapForRoundsAndDrawTime.get(roomCode)[0])}
            
        }
        console.log('hogaya')
        resolve()
    })
}

async function makingTeams(roomCode, roomType) {
    return new Promise(async (resolve, reject) => {
        const sockets = await io.in(roomCode).fetchSockets();
        let teamObj = {};
        let teamScoreObj = {};
        let socketTeam = {}

        if (roomType === 'solo') {
            for (let i = 1; i <= sockets.length; i++) {
                teamObj[`team${i}`] = [sockets[i - 1].id]
                teamScoreObj[`team${i}`] = 0
                socketTeam[`team${i}`] = [socketIDandRoom.get(sockets[i - 1].id).master]
            }
            globalMapForUserFromTeam.set(roomCode, socketTeam)
            globalMapForTeams.set(roomCode, teamObj)
        } else if (roomType === 'duo') {

            for (let i = 1, j = 1; i <= sockets.length; i++, j++) {
                let localTeamarr = []
                let localUserarr = []

                localTeamarr.push(sockets[i - 1].id)
                localUserarr.push(socketIDandRoom.get(sockets[i - 1].id).master)

                if (i < sockets.length) {
                    localTeamarr.push(sockets[i].id)
                    localUserarr.push(socketIDandRoom.get(sockets[i].id).master)
                }
                teamObj[`team${j}`] = localTeamarr
                socketTeam[`team${j}`] = localUserarr
                teamScoreObj[`team${j}`] = 0
                ++i
            }
            globalMapForUserFromTeam.set(roomCode, socketTeam)
            globalMapForTeams.set(roomCode, teamObj)
        } else {

            for (let i = 0, j = 1; i < sockets.length; i++, j++) {
                let localTeamarr = []
                let localUserarr = []
                localTeamarr.push(sockets[i].id)
                localUserarr.push(socketIDandRoom.get(sockets[i].id).master)

                if (i + 1 < sockets.length) {
                    localTeamarr.push(sockets[i + 1].id)
                    localUserarr.push(socketIDandRoom.get(sockets[i+1].id).master)
                }


                if (i + 2 < sockets.length) {
                    localTeamarr.push(sockets[i + 2].id)
                    localUserarr.push(socketIDandRoom.get(sockets[i+2].id).master)
                }

                teamObj[`team${j}`] = localTeamarr
                socketTeam[`team${j}`] = localUserarr
                teamScoreObj[`team${j}`] = 0

                if (i + 2 <= sockets.length) { i = i + 2 }
            }
            globalMapForUserFromTeam.set(roomCode, socketTeam)
            globalMapForTeams.set(roomCode, teamObj)
           
            }
            globalMapForTeamScore.set(roomCode, teamScoreObj)
            globalMapForGuessedTeams.set(roomCode, 0)

        resolve();
    })
}

async function fetchWords (roomCode){
    let indexOfArr = Math.floor(Math.random() * 6) 
     let word
     const type = typeOfWordArray[indexOfArr]
     const noOfWords = 1
   
     const url = `http://localhost:3000/api/fetchwords?noOfWords=${noOfWords}&type=${type}`;
   
     await fetch(url)
         .then(response => response.json())
         .then(data => word = data)
         .catch(error => console.error('Error:', error));
         io.to(roomCode).emit('wordToGuess',word)
}

function pause(millisec) {
    let timeoutId;
    const promise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => { resolve('') }, millisec);
        resolveMapForEachPromiseOfSetTimeout.set(timeoutId, resolve);
    });
    promise.timeoutId = timeoutId;
    return promise;
}

function pauseForScoreUpdatation(millisec) {
    const promise = new Promise((resolve, reject) => {
     setTimeout(() => { resolve('') }, millisec);
    });
    return promise;
}
module.exports = startEventHandler;