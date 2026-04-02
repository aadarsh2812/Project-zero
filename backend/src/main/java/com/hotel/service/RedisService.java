package com.hotel.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.session.ttl}")
    private long sessionTtl;

    private static final String SESSION_PREFIX = "session:";
    private static final String TABLE_SESSION_PREFIX = "table:";

    // ---- Session Management ----

    public void saveSession(String token, Map<String, Object> sessionData) {
        String key = SESSION_PREFIX + token;
        redisTemplate.opsForHash().putAll(key, sessionData);
        redisTemplate.expire(key, sessionTtl, TimeUnit.SECONDS);
        log.debug("Saved session for token {}", token);
    }

    public Map<Object, Object> getSession(String token) {
        String key = SESSION_PREFIX + token;
        return redisTemplate.opsForHash().entries(key);
    }

    public boolean sessionExists(String token) {
        String key = SESSION_PREFIX + token;
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
        return entries != null && !entries.isEmpty();
    }

    public void deleteSession(String token) {
        redisTemplate.delete(SESSION_PREFIX + token);
    }

    public void refreshSession(String token) {
        String key = SESSION_PREFIX + token;
        redisTemplate.expire(key, sessionTtl, TimeUnit.SECONDS);
    }

    // ---- Table-to-Customer Mapping ----

    public void addCustomerToTable(Long hotelId, String tableNo, String token) {
        String key = TABLE_SESSION_PREFIX + hotelId + ":" + tableNo;
        redisTemplate.opsForSet().add(key, token);
        redisTemplate.expire(key, sessionTtl, TimeUnit.SECONDS);
    }

    public void removeCustomerFromTable(Long hotelId, String tableNo, String token) {
        String key = TABLE_SESSION_PREFIX + hotelId + ":" + tableNo;
        redisTemplate.opsForSet().remove(key, token);
    }

    // ---- Pub/Sub ----

    public void publishKitchenEvent(Long hotelId, Object event) {
        String channel = "hotel_kitchen_" + hotelId;
        redisTemplate.convertAndSend(channel, event);
        log.debug("Published kitchen event to channel {}", channel);
    }

    // ---- Generic ----

    public void setValue(String key, Object value, long ttlSeconds) {
        redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
    }

    public Object getValue(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void deleteKey(String key) {
        redisTemplate.delete(key);
    }
}
