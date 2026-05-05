package com.example.demo.repository;

import com.example.demo.entity.Hotel;
import com.example.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HotelRepository extends JpaRepository<Hotel, String> {
    Optional<Hotel> findByAdminUser(User user);
    Optional<Hotel> findByKitchenUser(User user);
}
