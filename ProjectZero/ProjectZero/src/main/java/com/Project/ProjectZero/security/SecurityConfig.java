package com.Project.ProjectZero.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // === PUBLIC: Auth endpoints ===
                .requestMatchers("/api/customer/register").permitAll()
                .requestMatchers("/api/customer/validate").permitAll()
                .requestMatchers("/api/customer/google-auth").permitAll()
                .requestMatchers("/api/admin/login").permitAll()
                .requestMatchers("/api/kitchen/login").permitAll()

                // === PUBLIC: Read-only data ===
                .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/config/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/customer/hotel/**").permitAll()

                // === PUBLIC: WebSocket ===
                .requestMatchers("/ws/**").permitAll()

                // === CUSTOMER endpoints ===
                .requestMatchers(HttpMethod.POST, "/api/orders").hasRole("CUSTOMER")
                .requestMatchers(HttpMethod.GET, "/api/orders/customer").hasRole("CUSTOMER")
                .requestMatchers("/api/payments/finish-dining").hasRole("CUSTOMER")
                .requestMatchers("/api/payments/initiate").hasRole("CUSTOMER")
                .requestMatchers("/api/payments/verify").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers("/api/payments/session-history").hasRole("CUSTOMER")
                .requestMatchers("/api/payments/razorpay/**").hasAnyRole("CUSTOMER", "ADMIN")
                .requestMatchers("/api/feedback").hasRole("CUSTOMER")

                // === KITCHEN endpoints ===
                .requestMatchers("/api/orders/hotel/*/active").hasAnyRole("KITCHEN", "ADMIN")
                .requestMatchers("/api/orders/status").hasAnyRole("KITCHEN", "ADMIN")

                // === ADMIN endpoints ===
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/orders/**").hasAnyRole("ADMIN", "KITCHEN")
                .requestMatchers("/api/payments/manual-confirm/**").hasRole("ADMIN")

                // === All other requests must be authenticated ===
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
