package com.srlab.chatapplication.Configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

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
