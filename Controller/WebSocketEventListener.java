package com.srlab.chatapplication.Controller;

import com.srlab.chatapplication.Model.Message;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import static java.lang.String.format;


@MessageMapping("/chat/{roomId}/leaveuser")
    public void leaveRoom(@DestinationVariable String roomId, @Payload Message chatMessage,SimpMessageHeaderAccessor headerAccessor)
    {
        String currentRoomId = (String) headerAccessor.getSessionAttributes().put("room_id", roomId);
        if (currentRoomId != null) {
            Message leaveMessage = new Message();
            leaveMessage.setType(Message.MessageType.LEAVE);
            leaveMessage.setSender(chatMessage.getSender());
            addmessage(currentRoomId,chatMessage);
            messagingTemplate.convertAndSend(format("/room/%s", currentRoomId), leaveMessage);
        }
    }


    private void addmessage(String roomid, Message message)
    {
        for(ChatRoom room: rooms)
        {
            if(room.getRoomid().equals(roomid))
            {
                List<Message> messages = room.getMessages();
                messages.add(message);
                room.setMessages(messages);
                break;
            }
        }
    }

    @SubscribeMapping("chat/{roomId}/getPrevious")
    public List<Message> getPreviousMessages(@DestinationVariable String roomId)
    {
        System.out.println("Room Id is: "+roomId);
        List<Message> messages = new ArrayList<Message>();
        for(ChatRoom room: rooms)
        {
            if(room.getRoomid().equals(roomId))
            {
                messages = room.getMessages();
                break;
            }
        }
        return messages;
    }

}
