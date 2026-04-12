package com.Project.ProjectZero.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

/**
 * Verifies Google OAuth ID tokens by calling Google's tokeninfo endpoint.
 * Returns user info (email, name, picture, googleId) if valid.
 */
@Service
@Slf4j
public class GoogleAuthService {

    private static final String GOOGLE_TOKEN_INFO = "https://oauth2.googleapis.com/tokeninfo?id_token=";
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Verify a Google ID token and return user info.
     * @param idToken The Google ID token from the frontend
     * @return Map with email, name, picture, sub (Google user ID)
     * @throws RuntimeException if token is invalid
     */
    public Map<String, String> verifyGoogleToken(String idToken) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_TOKEN_INFO + idToken))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("Invalid Google token");
            }

            JsonNode json = objectMapper.readTree(response.body());

            String email = json.has("email") ? json.get("email").asText() : null;
            String name = json.has("name") ? json.get("name").asText() : 
                           json.has("given_name") ? json.get("given_name").asText() : "Guest";
            String picture = json.has("picture") ? json.get("picture").asText() : null;
            String googleId = json.has("sub") ? json.get("sub").asText() : null;

            if (email == null || googleId == null) {
                throw new RuntimeException("Google token missing required fields");
            }

            log.info("Google auth verified for: {} ({})", name, email);

            return Map.of(
                    "email", email,
                    "name", name,
                    "picture", picture != null ? picture : "",
                    "googleId", googleId
            );
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("Google token verification failed", e);
            throw new RuntimeException("Failed to verify Google token: " + e.getMessage());
        }
    }
}
