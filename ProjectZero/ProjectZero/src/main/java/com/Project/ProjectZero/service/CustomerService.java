package com.Project.ProjectZero.service;

import com.Project.ProjectZero.dto.*;
import com.Project.ProjectZero.model.Customer;
import com.Project.ProjectZero.model.Hotel;
import com.Project.ProjectZero.repository.CustomerRepository;
import com.Project.ProjectZero.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepo;
    private final HotelRepository hotelRepo;
    private final RedisService redisService;

    @Transactional
    public SessionResponse registerOrFetch(CustomerRequest req) {
        Hotel hotel = hotelRepo.findById(req.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found: " + req.getHotelId()));

        Customer customer = customerRepo.findByPhoneAndHotelId(req.getPhone(), req.getHotelId())
                .orElseGet(() -> customerRepo.save(Customer.builder()
                        .name(req.getName())
                        .phone(req.getPhone())
                        .token(UUID.randomUUID().toString())
                        .hotelId(req.getHotelId())
                        .build()));

        cacheSession(customer, req.getTableNo(), hotel.getName());
        redisService.addCustomerToTable(req.getHotelId(), req.getTableNo(), customer.getToken());
        return toResponse(customer, req.getTableNo(), hotel.getName());
    }

    @Transactional
    public SessionResponse validateAndMap(SessionValidateRequest req) {
        // Fast path: Redis hit
        if (redisService.sessionExists(req.getToken())) {
            Map<Object, Object> s = redisService.getSession(req.getToken());
            redisService.refreshSession(req.getToken());
            Long hotelId = Long.parseLong(s.get("hotelId").toString());
            redisService.addCustomerToTable(hotelId, req.getTableNo(), req.getToken());
            String hotelName = hotelRepo.findById(hotelId).map(Hotel::getName).orElse("");
            return SessionResponse.builder()
                    .token(req.getToken())
                    .customerId(Long.parseLong(s.get("customerId").toString()))
                    .customerName(s.get("name").toString())
                    .hotelId(hotelId)
                    .tableNo(req.getTableNo())
                    .hotelName(hotelName)
                    .build();
        }

        // Slow path: DB fallback
        Customer customer = customerRepo.findByToken(req.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        if (!customer.getHotelId().equals(req.getHotelId()))
            throw new RuntimeException("Token belongs to a different hotel");

        Hotel hotel = hotelRepo.findById(req.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        cacheSession(customer, req.getTableNo(), hotel.getName());
        redisService.addCustomerToTable(req.getHotelId(), req.getTableNo(), req.getToken());
        return toResponse(customer, req.getTableNo(), hotel.getName());
    }

    private void cacheSession(Customer c, String tableNo, String hotelName) {
        Map<String, Object> map = new HashMap<>();
        map.put("customerId", c.getId().toString());
        map.put("name", c.getName());
        map.put("phone", c.getPhone());
        map.put("hotelId", c.getHotelId().toString());
        map.put("tableNo", tableNo);
        map.put("hotelName", hotelName);
        redisService.saveSession(c.getToken(), map);
    }

    private SessionResponse toResponse(Customer c, String tableNo, String hotelName) {
        return SessionResponse.builder()
                .token(c.getToken()).customerId(c.getId()).customerName(c.getName())
                .hotelId(c.getHotelId()).tableNo(tableNo).hotelName(hotelName)
                .build();
    }
}
