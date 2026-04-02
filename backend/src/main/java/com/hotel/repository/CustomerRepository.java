package com.hotel.repository;

import com.hotel.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByToken(String token);
    Optional<Customer> findByPhoneAndHotelId(String phone, Long hotelId);
}
