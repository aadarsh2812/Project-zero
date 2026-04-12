package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BillRepository extends JpaRepository<Bill, String> {
    Optional<Bill> findBySessionId(String sessionId);
}
