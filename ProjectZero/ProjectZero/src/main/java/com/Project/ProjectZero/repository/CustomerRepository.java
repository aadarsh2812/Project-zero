package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByToken(String token);
    Optional<Customer> findByPhoneAndHotelId(String phone, Long hotelId);
    Optional<Customer> findByGoogleIdAndHotelId(String googleId, Long hotelId);
}
