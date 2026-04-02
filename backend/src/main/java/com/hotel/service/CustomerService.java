package com.hotel.service;

import com.hotel.dto.CustomerRequest;
import com.hotel.dto.SessionResponse;
import com.hotel.dto.SessionValidateRequest;
import com.hotel.model.Customer;
import com.hotel.model.Hotel;
import com.hotel.repository.CustomerRepository;
import com.hotel.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final HotelRepository hotelRepository;
    private final RedisService redisService;

    /**
     * Register a new customer or return existing by phone+hotelId.
     * Always persists to DB and caches in Redis.
     */
    @Transactional
    public SessionResponse registerOrFetch(CustomerRequest req) {
        Hotel hotel = hotelRepository.findById(req.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found: " + req.getHotelId()));

        // Check if customer with this phone already exists for this hotel
        Optional<Customer> existing = customerRepository.findByPhoneAndHotelId(req.getPhone(), req.getHotelId());

        Customer customer;
        if (existing.isPresent()) {
            customer = existing.get();
            log.info("Found existing customer {} for phone {}", customer.getId(), req.getPhone());
        } else {
            customer = customerRepository.save(Customer.builder()
                    .name(req.getName())
                    .phone(req.getPhone())
                    .token(UUID.randomUUID().toString())
                    .hotelId(req.getHotelId())
                    .build());
            log.info("Created new customer {} for phone {}", customer.getId(), req.getPhone());
        }

        // Cache session in Redis
        cacheSession(customer, req.getTableNo(), hotel.getName());

        // Map customer to table
        redisService.addCustomerToTable(req.getHotelId(), req.getTableNo(), customer.getToken());

        return buildResponse(customer, req.getTableNo(), hotel.getName());
    }

    /**
     * Validate token via Redis cache (bypasses Postgres).
     * Falls back to Postgres only if cache miss.
     */
    @Transactional
    public SessionResponse validateAndMap(SessionValidateRequest req) {
        // Fast path: Redis cache hit
        if (redisService.sessionExists(req.getToken())) {
            Map<Object, Object> session = redisService.getSession(req.getToken());
            redisService.refreshSession(req.getToken());

            // Update table mapping for this session
            String tableNo = req.getTableNo();
            Long hotelId = Long.parseLong(session.get("hotelId").toString());
            redisService.addCustomerToTable(hotelId, tableNo, req.getToken());

            Hotel hotel = hotelRepository.findById(hotelId)
                    .orElseThrow(() -> new RuntimeException("Hotel not found"));

            return SessionResponse.builder()
                    .token(req.getToken())
                    .customerId(Long.parseLong(session.get("customerId").toString()))
                    .customerName(session.get("name").toString())
                    .hotelId(hotelId)
                    .tableNo(tableNo)
                    .hotelName(hotel.getName())
                    .build();
        }

        // Slow path: DB lookup (cache miss)
        Customer customer = customerRepository.findByToken(req.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (!customer.getHotelId().equals(req.getHotelId())) {
            throw new RuntimeException("Token does not belong to this hotel");
        }

        Hotel hotel = hotelRepository.findById(req.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        // Re-cache the session
        cacheSession(customer, req.getTableNo(), hotel.getName());
        redisService.addCustomerToTable(req.getHotelId(), req.getTableNo(), req.getToken());

        return buildResponse(customer, req.getTableNo(), hotel.getName());
    }

    private void cacheSession(Customer customer, String tableNo, String hotelName) {
        Map<String, Object> sessionData = new HashMap<>();
        sessionData.put("customerId", customer.getId().toString());
        sessionData.put("name", customer.getName());
        sessionData.put("phone", customer.getPhone());
        sessionData.put("hotelId", customer.getHotelId().toString());
        sessionData.put("tableNo", tableNo);
        sessionData.put("hotelName", hotelName);
        redisService.saveSession(customer.getToken(), sessionData);
    }

    private SessionResponse buildResponse(Customer customer, String tableNo, String hotelName) {
        return SessionResponse.builder()
                .token(customer.getToken())
                .customerId(customer.getId())
                .customerName(customer.getName())
                .hotelId(customer.getHotelId())
                .tableNo(tableNo)
                .hotelName(hotelName)
                .build();
    }
}
