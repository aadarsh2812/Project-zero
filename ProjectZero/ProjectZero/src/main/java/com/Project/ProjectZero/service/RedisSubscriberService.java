package com.Project.ProjectZero.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j
public class RedisSubscriberService implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public RedisSubscriberService(SimpMessagingTemplate messagingTemplate,
                                   @Qualifier("redisObjectMapper") ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String body    = new String(message.getBody());
            String hotelId = channel.replace("hotel_kitchen_", "");

            Map<?, ?> payload = objectMapper.readValue(body, Map.class);
            String topic = "/topic/hotel/" + hotelId + "/kitchen";
            messagingTemplate.convertAndSend(topic, (Object) payload);
            log.debug("Forwarded Redis event to WebSocket {}", topic);
        } catch (Exception e) {
            log.error("Error processing Redis pub/sub message: {}", e.getMessage());
        }
    }
}
