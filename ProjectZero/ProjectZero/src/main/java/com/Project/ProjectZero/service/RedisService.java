package com.Project.ProjectZero.service;

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
    private static final String TABLE_PREFIX   = "table:";

    // ── Session ─────────────────────────────────────────────────────────
    public void saveSession(String token, Map<String, Object> data) {
        String key = SESSION_PREFIX + token;
        redisTemplate.opsForHash().putAll(key, data);
        redisTemplate.expire(key, sessionTtl, TimeUnit.SECONDS);
    }

    public Map<Object, Object> getSession(String token) {
        return redisTemplate.opsForHash().entries(SESSION_PREFIX + token);
    }

    public boolean sessionExists(String token) {
        Map<Object, Object> m = redisTemplate.opsForHash().entries(SESSION_PREFIX + token);
        return m != null && !m.isEmpty();
    }

    public void refreshSession(String token) {
        redisTemplate.expire(SESSION_PREFIX + token, sessionTtl, TimeUnit.SECONDS);
    }

    public void deleteSession(String token) {
        redisTemplate.delete(SESSION_PREFIX + token);
    }

    // ── Table→Customer mapping ───────────────────────────────────────────
    public void addCustomerToTable(Long hotelId, String tableNo, String token) {
        String key = TABLE_PREFIX + hotelId + ":" + tableNo;
        redisTemplate.opsForSet().add(key, token);
        redisTemplate.expire(key, sessionTtl, TimeUnit.SECONDS);
    }

    // ── Pub/Sub ──────────────────────────────────────────────────────────
    public void publishKitchenEvent(Long hotelId, Object payload) {
        String channel = "hotel_kitchen_" + hotelId;
        redisTemplate.convertAndSend(channel, payload);
        log.debug("Published to {}", channel);
    }
}
