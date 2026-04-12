package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByBillId(String billId);
    List<Payment> findBySessionId(String sessionId);
}
