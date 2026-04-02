package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HotelRepository extends JpaRepository<Hotel, Long> {
    Optional<Hotel> findByAdminUsername(String adminUsername);
    Optional<Hotel> findByAdminUsernameAndAdminPassword(String username, String password);
}
