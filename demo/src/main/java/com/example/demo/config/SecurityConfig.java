package com.example.demo.config;

import com.example.demo.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, AuthenticationProvider authenticationProvider) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.authenticationProvider = authenticationProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(req -> req
                        // ── Public: Auth ──
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // ── Public: Menu (read-only for customers) ──
                        .requestMatchers(HttpMethod.GET, "/api/v1/menu", "/api/v1/menu/**").permitAll()

                        // ── Public: Hotel info (customers need hotel name/logo/settings) ──
                        .requestMatchers(HttpMethod.GET, "/api/v1/hotels", "/api/v1/hotels/**").permitAll()

                        // ── Public: Customers place orders + track their own order ──
                        .requestMatchers(HttpMethod.POST, "/api/v1/orders").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/orders").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/orders/**").permitAll()

                        // ── Protected: All mutating operations require authentication ──
                        .requestMatchers(HttpMethod.POST, "/api/v1/hotels", "/api/v1/hotels/**").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/hotels/**").hasAnyRole("SUPERADMIN", "ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/hotels/**").hasRole("SUPERADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/hotels/**").hasRole("SUPERADMIN")

                        .requestMatchers(HttpMethod.PATCH, "/api/v1/orders/*/status").hasAnyRole("ADMIN", "KITCHEN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/orders/*/payment").hasAnyRole("ADMIN", "KITCHEN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/orders/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/v1/menu", "/api/v1/menu/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/menu/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/menu/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                )
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(List.of("*"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
