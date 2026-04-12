package com.Project.ProjectZero.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long customerExpiration;
    private final long staffExpiration;
    private final long adminExpiration;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.customer.expiration}") long customerExp,
            @Value("${jwt.staff.expiration}") long staffExp,
            @Value("${jwt.admin.expiration}") long adminExp) {
        // Ensure key is at least 256 bits for HS256
        byte[] keyBytes = new byte[64];
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        System.arraycopy(secretBytes, 0, keyBytes, 0, Math.min(secretBytes.length, keyBytes.length));
        this.key = Keys.hmacShaKeyFor(keyBytes);
        this.customerExpiration = customerExp;
        this.staffExpiration = staffExp;
        this.adminExpiration = adminExp;
    }

    // --- Customer JWT ---
    public String generateCustomerToken(String sessionId, Long customerId, Long hotelId, String tableNo, String customerName) {
        return Jwts.builder()
                .subject(sessionId)
                .claims(Map.of(
                        "customerId", customerId,
                        "hotelId", hotelId,
                        "tableNo", tableNo,
                        "customerName", customerName,
                        "role", "CUSTOMER"
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + customerExpiration))
                .signWith(key)
                .compact();
    }

    // --- Kitchen Staff JWT ---
    public String generateKitchenToken(Long staffId, Long hotelId, String name) {
        return Jwts.builder()
                .subject(String.valueOf(staffId))
                .claims(Map.of(
                        "hotelId", hotelId,
                        "staffName", name,
                        "role", "KITCHEN"
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + staffExpiration))
                .signWith(key)
                .compact();
    }

    // --- Admin JWT ---
    public String generateAdminToken(Long hotelId, String username, String hotelName) {
        return Jwts.builder()
                .subject(username)
                .claims(Map.of(
                        "hotelId", hotelId,
                        "hotelName", hotelName,
                        "role", "ADMIN"
                ))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + adminExpiration))
                .signWith(key)
                .compact();
    }

    // --- Validation ---
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isValid(String token) {
        try {
            validateToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getRole(Claims claims) {
        return claims.get("role", String.class);
    }

    public Long getHotelId(Claims claims) {
        return claims.get("hotelId", Long.class);
    }

    public String getSessionId(Claims claims) {
        return claims.getSubject();
    }

    public Long getCustomerId(Claims claims) {
        return claims.get("customerId", Long.class);
    }
}
