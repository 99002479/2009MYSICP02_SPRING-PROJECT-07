
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
function onPreviousMessage(payload)
{
    var messages = JSON.parse(payload.body);
    for (var i=0, len = messages.length;i<len;i++ )
    {
        showMessage(messages[i]);
    }
}

function sendMessage(event) {
  var messageContent = messageInput.value.trim();
  if (messageContent.startsWith('/join ')) {
    var newRoomId = messageContent.substring('/join '.length);
    var chatRoom = {
        roomid: newRoomId
    };
    stompClient.send("/chatapp/chat/rooms", {}, JSON.stringify(chatRoom));
    enterRoom(newRoomId);
    while (messageArea.firstChild) {
      messageArea.removeChild(messageArea.firstChild);
    }
  }
  else if(messageContent.startsWith('/leave'))
  {
    chatPage.classList.add('hidden');
    roomPage.classList.remove('hidden');
    stompClient.send(`/chatapp/chat/{roomId}/leaveuser`,
        {},
        JSON.stringify({sender: username, type: 'LEAVE'}));
    listRoom();
    while (messageArea.firstChild) {
        messageArea.removeChild(messageArea.firstChild);
    }
  }
  else if (messageContent && stompClient) {
    var chatMessage = {
      sender: username,
      content: messageInput.value,
      type: 'CHAT'
    };
    stompClient.send(`${topic}/sendMessage`, {}, JSON.stringify(chatMessage));
  }
  messageInput.value = '';
  event.preventDefault();
}



function onMessageReceived(payload) {
  var message = JSON.parse(payload.body);
  showMessage(message);

}

function showMessage(message)
{
    var messageElement = document.createElement('li');

      if (message.type == 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
      } else if (message.type == 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
      } else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
      }

      var textElement = document.createElement('p');
      var messageText = document.createTextNode(message.content);
      textElement.appendChild(messageText);

      messageElement.appendChild(textElement);

      messageArea.appendChild(messageElement);
      messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
  var hash = 0;
  for (var i = 0; i < messageSender.length; i++) {
      hash = 31 * hash + messageSender.charCodeAt(i);
  }
  var index = Math.abs(hash % colors.length);
  return colors[index];
}


//main function
$(document).ready(function() {

  var savedName = Cookies.get('name');
  if (savedName) {
    nameInput.val(savedName);
  }


  usernamePage.classList.remove('hidden');

  usernameForm.addEventListener('submit', connect, true);
  createRoomForm.addEventListener('submit', createRoom, true);
  messageForm.addEventListener('submit', sendMessage, true);
});



