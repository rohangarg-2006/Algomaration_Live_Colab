import { getSocketInstance } from './socketInstance.js';
const socket = getSocketInstance()


const leave = new Audio('/leave.mp3');
const join = new Audio('/join.mp3');

let userRole = 'viewer'



document.addEventListener('DOMContentLoaded', () => {

  
  const room = localStorage.getItem('room')
  let userName = localStorage.getItem('userName')
  const roomCode = localStorage.getItem('roomCode');


  // Function to toggle between viewer and editor modes
function toggleMode(mode) {
  // Get elements by their IDs
  const editBtn = document.getElementById('editBtn');
  const changeDataBtn = document.getElementById('changeDataBtn');
  const radarBtn = document.getElementById('radarBtn');
  const lineBtn = document.getElementById('lineBtn');
  const polarAreaBtn = document.getElementById('polarAreaBtn');
  const barBtn = document.getElementById('barBtn');
  const editForm = document.getElementById('editForm');
  const changeDataForm = document.getElementById('changeDataForm');

  // Disable or enable based on mode
  const isEditor = mode === 'editor';

  // Buttons and forms
  editBtn.disabled = !isEditor;
  changeDataBtn.disabled = !isEditor;
  radarBtn.disabled = !isEditor;
  lineBtn.disabled = !isEditor;
  polarAreaBtn.disabled = !isEditor;
  barBtn.disabled = !isEditor;

  // Forms visibility
  editForm.classList.toggle('hidden', !isEditor);
  changeDataForm.classList.toggle('hidden', !isEditor);

  // Styling (optional: to indicate disabled state visually)
  const allButtons = [editBtn, changeDataBtn, radarBtn, lineBtn, polarAreaBtn, barBtn];
  allButtons.forEach((button) => {
    button.classList.toggle('opacity-50', !isEditor);
    button.classList.toggle('cursor-not-allowed', !isEditor);
  });
}

// Example usage:
// Set mode to viewer


// Set mode to editor


 ////chart.js code

 let chart;
 let chartData;

 const createChart = (data, type) => {
     const ctx = document.getElementById('myChart');
     if (chart) {
         chart.destroy();
     }

     chart = new Chart(ctx, {
         type: type,
         data: {
             labels: data.x,
             datasets: [{
                 label: '# of Votes',
                 data: data.y,
                 borderWidth: 2,
                 backgroundColor: 'rgba(9, 189, 235, 0.2)',
                 borderColor: 'rgba(9, 189, 235, 1)',
             }]
         },
         options: {
             scales: {
                 y: {
                     beginAtZero: true
                 }
             }
         }
     });
 };

 document.getElementById('uploadBtn').addEventListener('click', () => {
     const file = document.getElementById("uploadFile").files[0];

     if (!file) {
         window.alert("File not uploaded");
         return;
     }

     if (file.type !== "application/json") {
         window.alert("Upload a valid JSON file");
         return;
     }

     const reader = new FileReader();

     reader.onload = (e) => {
         const text = e.target.result;
         const obj = JSON.parse(text);
         chartData = obj;

         socket.emit('chartData',chartData,roomCode,'bar')
         console.log('emitted');

      

         if (!Array.isArray(obj.x) || !Array.isArray(obj.y)) {
             console.error("Invalid data");
             return;
         }

       

         document.getElementById("uploadSection").style.display = "none";
         document.getElementById("chartSection").style.display = "block";
     };

     reader.readAsText(file);
 });

 socket.on('DrawGraph',(chartData,type)=>{
  document.getElementById("chartSection").style.display = "block";
  createChart(chartData, type);
})
 


 document.getElementById('radarBtn').addEventListener('click', () => {
     if (chartData) {
      socket.emit('chartData',chartData,roomCode,'radar')

  
       
     }
 });

 document.getElementById('lineBtn').addEventListener('click', () => {
     if (chartData) {
      socket.emit('chartData',chartData,roomCode,'line')
       
     }
 });

 document.getElementById('polarAreaBtn').addEventListener('click', () => {
     if (chartData) {
      socket.emit('chartData',chartData,roomCode,'polarArea')
     }
 });



 document.getElementById('barBtn').addEventListener('click', () => {
     if (chartData) {
      socket.emit('chartData',chartData,roomCode,'bar')  
     }
 });



 document.getElementById('editBtn').addEventListener('click', () => {
     document.getElementById('editForm').style.display = 'block';
     document.getElementById('changeDataForm').style.display = 'none';
 });

 document.getElementById('saveBtn').addEventListener('click', () => {
     const newXValues = document.getElementById('newXData').value.split(',').map(item => item.trim());
     const newYValues = document.getElementById('newYData').value.split(',').map(item => parseFloat(item.trim()));

     socket.emit('dataAdd',roomCode,newXValues,newYValues,chartData)
 });

 socket.on('addDataToOther', (newXValues, newYValues, updatedChartData) => {
  chartData = updatedChartData; // Update local reference

  chart.data.labels = chartData.x;
  chart.data.datasets[0].data = chartData.y;
  chart.update();

  document.getElementById('editForm').style.display = 'none';
});

 document.getElementById('changeDataBtn').addEventListener('click', () => {
     document.getElementById('changeDataForm').style.display = 'block';
     document.getElementById('editForm').style.display = 'none';
 });

 document.getElementById('updateDataBtn').addEventListener('click', () => {
     const xLabel = document.getElementById('xLabel').value.trim();
     const newYValue = parseFloat(document.getElementById('newYValue').value.trim());

     socket.emit('dataChange',roomCode,xLabel,newYValue,chartData)
 });

 socket.on('dataChangeForOthers', (xLabel, newYValue, updatedChartData) => {
  chartData = updatedChartData; // Update local reference

  chart.data.datasets[0].data = chartData.y;
  chart.update();

  document.getElementById('changeDataForm').style.display = 'none';
})

 ////

  
  socket.on('populateUserBoard', (userArray,masterArray) => {

    const userBoard = document.querySelector('.users')
    while (userBoard.firstChild) {
      userBoard.removeChild(userBoard.firstChild);
    }
    masterArray.forEach(user => {
      userBoard.appendChild(createUserElement(user,"boss"));
    });
    userArray.forEach(user => {
      userBoard.appendChild(createUserElement(user,"viewer"));
    });
  })

  function createUserElement(user,role) {

    
    const userDiv = document.createElement('div');
    userDiv.className = 'bg-gray-700 text-xl rounded-lg shadow p-3 flex flex-col items-center'
    const username = document.createElement('span');
    username.className = 'text-white';
    username.textContent = user

    const userScore = document.createElement('span');
    userScore.className = 'text-white';
     userScore.textContent = role;
   
     if(room === 'true' && role!=="boss"){
        username.addEventListener('click',function(event) {
          const clickedElement = event.target;
  
          // Log the clicked element's innerHTML
          console.log('Clicked element innerHTML:', clickedElement.innerHTML);
  
          let editedGuy = clickedElement.innerHTML
          const popupDiv = document.createElement('div');
  
          // Add content or classes to the div
          popupDiv.innerHTML = `
          <div style="
              border-radius: 12px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
              padding: 15px 20px;
              background-color: #ffffff;
              position: absolute;
              top: ${event.pageY}px;
              left: ${event.pageX}px;
              z-index: 1000;
              font-family: 'Arial', sans-serif;
              max-width: 300px;
              animation: fadeIn 0.3s ease-in-out;
          ">
              <p style="
                  margin: 0 0 10px 0;
                  font-size: 18px;
                  font-weight: bold;
                  color: #333;
                  text-align: center;
              ">Choose an Option</p>
              <div style="
                  display: flex;
                  justify-content: space-between;
                  gap: 10px;
              ">
                  <button id="editor" style="
                      padding: 10px 20px;
                      background-color: #007bff;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      cursor: pointer;
                      transition: background-color 0.3s ease;
                      font-size: 14px;
                      flex: 1;
                  " onmouseover="this.style.backgroundColor='#0056b3';" onmouseout="this.style.backgroundColor='#007bff';">
                      Editor
                  </button>
                  <button id="viewer" style="
                      padding: 10px 20px;
                      background-color: #6c757d;
                      color: white;
                      border: none;
                      border-radius: 8px;
                      cursor: pointer;
                      transition: background-color 0.3s ease;
                      font-size: 14px;
                      flex: 1;
                  " onmouseover="this.style.backgroundColor='#5a6268';" onmouseout="this.style.backgroundColor='#6c757d';">
                      Viewer
                  </button>
              </div>
          </div>
      
          <style>
              @keyframes fadeIn {
                  from {
                      opacity: 0;
                      transform: scale(0.9);
                  }
                  to {
                      opacity: 1;
                      transform: scale(1);
                  }
              }
          </style>
      `;
      
  
          // Append the div to the body
          document.body.appendChild(popupDiv);
  
          // Add event listeners for the buttons
          document.getElementById('editor').addEventListener('click', function () {
            socket.emit('changeUserRoletoEditor',editedGuy,roomCode)
              popupDiv.remove();
          });
  
          document.getElementById('viewer').addEventListener('click', function () {
            socket.emit('changeUserRoletoViewer',editedGuy,roomCode)
              // Remove the popup div
              popupDiv.remove();
          });
  
          // Add an event listener to the popup itself to make it vanish on click
          setTimeout(function () {
            document.addEventListener('click', function () {
              popupDiv.remove();
          });
        }, 500)
          
      })

     }
    
    userDiv.appendChild(username);
    userDiv.appendChild(userScore)
    return userDiv;
  }

  const chatBox = document.getElementById('chat-box');
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');

  function addMessage(message, user) {
    const messageElement = document.createElement('div');
    // messageElement.style.border = '1px solid black';
    messageElement.style.overflow = 'hidden';
    messageElement.style.textOverflow = 'ellipsis';
    messageElement.style.whiteSpace = 'nowrap';
    messageElement.style.borderRadius = '4px';
    messageElement.style.margin = '4px';
    messageElement.style.padding = '6px';
    messageElement.style.paddingLeft = '4px';
    messageElement.style.background = '#343332';
    messageElement.style.color = 'white';

  
    messageElement.textContent = `${user} : ${message}`;
    messageElement.classList.add('chat-message');
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  sendButton.addEventListener('click', () => {
    let message = chatInput.value.trim();
    if (message != '') {
      addMessage(message, userName, null);
      socket.emit('message', message, userName, roomCode)
    }
    chatInput.value = ' '
  });

  socket.on('addMessage', (messageFromuser, userNameOfSentMessage) => {
    if (messageFromuser !== '') {
      addMessage(messageFromuser, userNameOfSentMessage);
    }
  })

  

  chatInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendButton.click();
    }
  });

  



  socket.on("userJoined", () => {
    join.play()
  })

  socket.on('toViewer', (user) => {

    const userElements = document.getElementsByClassName('users')[0].children;

    Array.from(userElements).forEach((child) => {
      const grandChildren = child.children;

      Array.from(grandChildren).forEach((grandChild) => {
        if (grandChild.textContent === user) {
          grandChildren[1].innerText = 'viewer'

        }
      });
    });

   if(userName===user){
    toggleMode('viewer');
    userRole = 'viewer'
   }

   console.log(userRole)
});


socket.on('toEditor', (user) => {

  const userElements = document.getElementsByClassName('users')[0].children;

  Array.from(userElements).forEach((child) => {
    const grandChildren = child.children;

    Array.from(grandChildren).forEach((grandChild) => {
      if (grandChild.textContent === user) {
        grandChildren[1].innerText = 'editor'

      }
    });
  });

  if(userName===user){
    toggleMode('editor');
    userRole = 'editor'
  }

  console.log(userRole)
});



 
  
  

   

 



  const canvas = document.querySelector('canvas');
  const c = canvas.getContext("2d");

  canvas.width = 1024;
  canvas.height = 768;

  socket.on('clearCanvas', () => {
    c.clearRect(0, 0, canvas.width, canvas.height);
  })

 

  

 






 


  let saveBtn = document.querySelector(".save")
  // saveBtn.addEventListener("click", () => {
  //   let data = canvas.toDataURL("imag/png")
  //   let a = document.createElement("a")
  //   a.href = data
  //   a.download = "sketch.png"
  //   a.click()
  // })

  
  
  socket.on('removeUser', (userToBeRemoved) => {
    const userElements = document.getElementsByClassName('users')[0].children;

    Array.from(userElements).forEach((child) => {
      const grandChildren = child.children;

      Array.from(grandChildren).forEach((grandChild) => {
        if (grandChild.textContent === userToBeRemoved) {
          child.remove()
          leave.play()
        }
      });
    });
  })

  

  
 

  if (room === 'false') {
    toggleMode('viewer');

    const restrictUploadSection = () => {
      if (userRole !== 'Boss') {
          const uploadSection = document.getElementById('uploadSection');
          const uploadFile = document.getElementById('uploadFile');
          const uploadBtn = document.getElementById('uploadBtn');
  
          if (uploadSection && uploadFile && uploadBtn) {
              // Disable the file input and button
              uploadFile.disabled = true;
              uploadBtn.disabled = true;
  
              // Hide the upload section
              uploadSection.style.display = 'none';
          }
      }
  };
  
  // Call the function to apply restrictions
  restrictUploadSection();

    userRole = 'viewer'
    document.getElementById("start-lobby").style.display = "none";
    document.getElementById("start-lobby").disabled = true;
    if (!userName) {
      userName = "Anonymous";
    }
    const obj = {
      "code": roomCode,
      "slaves": userName,
      "socketID": socket.id
    }
    socket.emit("joinRoom", obj);
    socket.on("responseAfterJoinRoomEvent", (response) => {
      if (response[0] === false) {
        console.log("Unable to join the room");
        window.location.href = '/'
        return
      }
    })
  } else if (room === 'true') {

    const restrictUploadSection = () => {
      if (userRole !== 'Boss') {
          const uploadSection = document.getElementById('uploadSection');
          const uploadFile = document.getElementById('uploadFile');
          const uploadBtn = document.getElementById('uploadBtn');
  
          if (uploadSection && uploadFile && uploadBtn) {
              // Disable the file input and button
              uploadFile.disabled = true;
              uploadBtn.disabled = true;
  
              // Hide the upload section
              uploadSection.style.display = 'none';
          }
      }
  };
  userRole = 'Boss'
  // Call the function to apply restrictions
  restrictUploadSection();

    
   

    const obj = {
      "name": roomCode,
      "code": roomCode,
      "master": userName,
     
      "socketID": socket.id
    }
    socket.emit("createRoom", obj);
  }

  

  socket.on("responseAfterCreateRoomEvent", (response) => {
    if (response[0] === false) {

      window.location.href = '/'
      return;
    }
  })

  

  socket.on('newUserJoinedevent', (roomCode) => {


    const imageData = c.getImageData(0, 0, canvas.width, canvas.height)

    const imagedata = {
      width: imageData.width,
      height: imageData.height,
      data: Array.from(imageData.data)
    };


    socket.emit('sendPrevDrawing', imagedata, roomCode)
  })



 

  

  

  




})