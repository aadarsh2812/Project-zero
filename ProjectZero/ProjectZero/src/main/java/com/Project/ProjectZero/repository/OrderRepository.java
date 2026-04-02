package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderRef(String orderRef);
    List<Order> findByHotelIdOrderByCreatedAtDesc(Long hotelId);
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Order> findByHotelIdAndStatusIn(Long hotelId, List<Order.OrderStatus> statuses);
    long countByHotelId(Long hotelId);
}
