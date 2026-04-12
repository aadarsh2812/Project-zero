package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.CustomerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CustomerSessionRepository extends JpaRepository<CustomerSession, String> {
    Optional<CustomerSession> findByToken(String token);
    Optional<CustomerSession> findByTableNoAndHotelIdAndStatus(String tableNo, Long hotelId, CustomerSession.SessionStatus status);
    long countByHotelIdAndStatus(Long hotelId, CustomerSession.SessionStatus status);
}
