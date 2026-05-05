package com.example.demo.dto;

public class AuthResponse {
    private String token;
    private String role;
    private String hotelId;

    public AuthResponse() {}

    public AuthResponse(String token, String role, String hotelId) {
        this.token = token;
        this.role = role;
        this.hotelId = hotelId;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getHotelId() { return hotelId; }
    public void setHotelId(String hotelId) { this.hotelId = hotelId; }
}
