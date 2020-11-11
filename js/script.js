'use strict';


//User Name Page Variable
var nameInput = $('#name');
var usernamePage = document.querySelector('#username-page');
var usernameForm = document.querySelector('#usernameForm');

//Chat Page Variable
var chatPage = document.querySelector('#chat-page');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var roomIdDisplay = document.querySelector('#room-id-display');

//Chat Room Page Variable
var roomPage = document.querySelector('#room-page');
var listOfRoom = document.querySelector('#listRoom');
var createRoomForm = document.querySelector('#createRoomForm');
var roomName = document.querySelector('#roomName');

var stompClient = null;
var currentSubscription;
var username = null;
var roomId = null;
var topic = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];



// Function Triggered After clicking ENter the application Button
function connect(event) {
  username = nameInput.val().trim();
  if (!username.match(/\S/))
  {
  		alert('Please enter an User Name.');
  		return false;
  }
  else
  {
      Cookies.set('name', username);
      if (username) {
        usernamePage.classList.add('hidden');
        roomPage.classList.remove('hidden');

        var socket = new SockJS('/usaskchat');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
      }
  }
  event.preventDefault();
}

function onConnected() {
  //enterRoom(roomInput.val());
  listRoom();
  connectingElement.classList.add('hidden');
}

function onError(error) {
  connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
  connectingElement.style.color = 'red';
}

//Function Called from On COnnected Function
function listRoom()
{

    if (currentSubscription) {
        currentSubscription.unsubscribe();
    }
    currentSubscription = stompClient.subscribe(`/chatapp/chat/rooms`, onListofRoom);

}

// Result form subscribe function of listRoom is processed here
function onListofRoom(payload)
{
    document.getElementById('listRoom').innerHTML = "";

     var rooms = JSON.parse(payload.body);
     for (var i=0, len = rooms.length;i<len;i++ )
     {
        var roomElement = document.createElement('li');
        roomElement.classList.add('list-group-item');

        var formElement = document.createElement('form');
        formElement.setAttribute("id", "joinroom");

        var textElement = document.createElement('label');
        textElement.setAttribute("style","margin-right: 20px");
        var roomText = document.createTextNode(rooms[i].roomid);
        textElement.appendChild(roomText);

        var buttonElement = document.createElement('button');
        buttonElement.setAttribute("type","submit");
        buttonElement.setAttribute("class","btn btn-primary join");
        buttonElement.setAttribute("value",rooms[i].roomid);
        var buttonText = document.createTextNode("Join");
        buttonElement.appendChild(buttonText);

        formElement.appendChild(textElement);
        formElement.appendChild(buttonElement);

        roomElement.appendChild(formElement);

        listOfRoom.appendChild(roomElement);
        listOfRoom.scrollTop = listOfRoom.scrollHeight;

     }
}


//Function triggered after clicking create room
function createRoom(event) {
    var roomNameValue = roomName.value.trim();
    if(roomNameValue)
    {
        roomPage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        var chatRoom = {
                    roomid: roomNameValue
        };
        stompClient.send("/chatapp/chat/rooms", {}, JSON.stringify(chatRoom));
        enterRoom(roomNameValue);
    }
    event.preventDefault();
}


$(document).on('click', '.btn.btn-primary.join', function(event){
    var roomNameValue = $(this).attr('value');
    if(roomNameValue)
    {
        roomPage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        enterRoom(roomNameValue);
    }
    event.preventDefault();
});


// Leave the current room and enter a new one.
function enterRoom(newRoomId) {
  roomId = newRoomId;
  Cookies.set('roomId', roomId);
  roomIdDisplay.textContent = roomId;
  topic = `/chatapp/chat/${newRoomId}`;

  if (currentSubscription) {
    currentSubscription.unsubscribe();
  }
  stompClient.subscribe(`/chatapp/chat/${roomId}/getPrevious`, onPreviousMessage);
  currentSubscription = stompClient.subscribe(`/room/${roomId}`, onMessageReceived);

  stompClient.send(`${topic}/addUser`,
    {},
    JSON.stringify({sender: username, type: 'JOIN'})
  );
}


