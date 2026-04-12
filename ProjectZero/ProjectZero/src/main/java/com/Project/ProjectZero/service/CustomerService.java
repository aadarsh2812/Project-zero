package com.Project.ProjectZero.service;

import com.Project.ProjectZero.dto.*;
import com.Project.ProjectZero.model.Customer;
import com.Project.ProjectZero.model.CustomerSession;
import com.Project.ProjectZero.model.Hotel;
import com.Project.ProjectZero.repository.CustomerRepository;
import com.Project.ProjectZero.repository.CustomerSessionRepository;
import com.Project.ProjectZero.repository.HotelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

import com.Project.ProjectZero.security.JwtUtil;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepo;
    private final HotelRepository hotelRepo;
    private final CustomerSessionRepository sessionRepo;
    private final GoogleAuthService googleAuthService;
    private final JwtUtil jwtUtil;

    @Transactional
    public SessionResponse registerOrFetch(CustomerRequest req) {
        Hotel hotel = hotelRepo.findById(req.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found: " + req.getHotelId()));

        Customer customer = customerRepo.findByPhoneAndHotelId(req.getPhone(), req.getHotelId())
                .orElseGet(() -> customerRepo.save(Customer.builder()
                        .name(req.getName())
                        .phone(req.getPhone())
                        .token(UUID.randomUUID().toString()) // Keep backward compatibility
                        .hotelId(req.getHotelId())
                        .build()));

        // Session continuity: look for any existing ACTIVE session for this customer at this hotel
        Optional<CustomerSession> activeSessionOpt = sessionRepo.findByTableNoAndHotelIdAndStatus(
                req.getTableNo(), req.getHotelId(), CustomerSession.SessionStatus.ACTIVE);
        
        CustomerSession session;
        if (activeSessionOpt.isPresent() && activeSessionOpt.get().getCustomerId().equals(customer.getId())) {
            session = activeSessionOpt.get(); // Resume active session
        } else {
            // Check for a COMPLETED (bill generated, not paid) session to resume
            Optional<CustomerSession> completedOpt = sessionRepo.findByTableNoAndHotelIdAndStatus(
                    req.getTableNo(), req.getHotelId(), CustomerSession.SessionStatus.COMPLETED);
            if (completedOpt.isPresent() && completedOpt.get().getCustomerId().equals(customer.getId())) {
                session = completedOpt.get();
                session.setStatus(CustomerSession.SessionStatus.ACTIVE); // Reactivate
                session = sessionRepo.save(session);
                log.info("Reactivated COMPLETED session {} for customer {}", session.getId(), customer.getName());
            } else {
                // Create a brand new session
                session = sessionRepo.save(CustomerSession.builder()
                        .token(UUID.randomUUID().toString())
                        .hotelId(hotel.getId())
                        .customerId(customer.getId())
                        .tableNo(req.getTableNo())
                        .status(CustomerSession.SessionStatus.ACTIVE)
                        .build());
            }
        }

        return toResponse(session, customer, hotel.getName());
    }

    @Transactional
    public SessionResponse handleGoogleAuth(String idToken, Long hotelId, String tableNo) {
        Hotel hotel = hotelRepo.findById(hotelId)
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        Map<String, String> userInfo = googleAuthService.verifyGoogleToken(idToken);
        String googleId = userInfo.get("googleId");
        String email = userInfo.get("email");
        String name = userInfo.get("name");
        String picture = userInfo.get("picture");

        Customer customer = customerRepo.findByGoogleIdAndHotelId(googleId, hotelId)
                .orElseGet(() -> customerRepo.save(Customer.builder()
                        .name(name)
                        .email(email)
                        .googleId(googleId)
                        .profilePicture(picture)
                        .token(UUID.randomUUID().toString()) // Keep backward compatibility
                        .hotelId(hotelId)
                        .build()));

        // Continue with session logic just like registerOrFetch
        Optional<CustomerSession> activeSessionOpt = sessionRepo.findByTableNoAndHotelIdAndStatus(
                tableNo, hotelId, CustomerSession.SessionStatus.ACTIVE);

        CustomerSession session;
        if (activeSessionOpt.isPresent() && activeSessionOpt.get().getCustomerId().equals(customer.getId())) {
            session = activeSessionOpt.get(); // Resume active session
        } else {
            Optional<CustomerSession> completedOpt = sessionRepo.findByTableNoAndHotelIdAndStatus(
                    tableNo, hotelId, CustomerSession.SessionStatus.COMPLETED);
            if (completedOpt.isPresent() && completedOpt.get().getCustomerId().equals(customer.getId())) {
                session = completedOpt.get();
                session.setStatus(CustomerSession.SessionStatus.ACTIVE);
                session = sessionRepo.save(session);
                log.info("Reactivated COMPLETED session {} for customer {}", session.getId(), customer.getName());
            } else {
                session = sessionRepo.save(CustomerSession.builder()
                        .token(UUID.randomUUID().toString())
                        .hotelId(hotelId)
                        .customerId(customer.getId())
                        .tableNo(tableNo)
                        .status(CustomerSession.SessionStatus.ACTIVE)
                        .build());
            }
        }

        return toResponse(session, customer, hotel.getName());
    }

    @Transactional
    public SessionResponse validateAndMap(SessionValidateRequest req) {
        // Slow path: DB fallback
        CustomerSession session = sessionRepo.findByToken(req.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid session token"));

        if (!session.getHotelId().equals(req.getHotelId()))
            throw new RuntimeException("Session belongs to a different hotel");

        // Block only PAID sessions — COMPLETED sessions can be resumed
        if (session.getStatus() == CustomerSession.SessionStatus.PAID) {
            throw new RuntimeException("Session already paid. Please start a new session.");
        }

        // Reactivate COMPLETED sessions
        if (session.getStatus() == CustomerSession.SessionStatus.COMPLETED) {
            session.setStatus(CustomerSession.SessionStatus.ACTIVE);
        }

        Customer customer = customerRepo.findById(session.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Hotel hotel = hotelRepo.findById(req.getHotelId())
                .orElseThrow(() -> new RuntimeException("Hotel not found"));

        if (!session.getTableNo().equals(req.getTableNo())) {
            session.setTableNo(req.getTableNo());
        }
        sessionRepo.save(session);

        return toResponse(session, customer, hotel.getName());
    }

    private SessionResponse toResponse(CustomerSession s, Customer c, String hotelName) {
        String jwtToken = jwtUtil.generateCustomerToken(s.getToken(), c.getId(), s.getHotelId(), s.getTableNo(), c.getName());
        return SessionResponse.builder()
                .token(jwtToken)
                .customerId(c.getId())
                .customerName(c.getName())
                .hotelId(s.getHotelId())
                .tableNo(s.getTableNo())
                .hotelName(hotelName)
                .build();
    }
}
