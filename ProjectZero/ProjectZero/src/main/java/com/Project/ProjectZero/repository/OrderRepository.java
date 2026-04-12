package com.Project.ProjectZero.repository;

import com.Project.ProjectZero.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderRef(String orderRef);
    List<Order> findByHotelIdOrderByCreatedAtDesc(Long hotelId);
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Order> findByHotelIdAndStatusIn(Long hotelId, List<Order.OrderStatus> statuses);
    long countByHotelId(Long hotelId);

    // Fix #6: Query by session instead of customer
    List<Order> findBySessionIdOrderByCreatedAtDesc(String sessionId);

    // For analytics
    @Query("SELECT COUNT(o) FROM Order o WHERE o.hotelId = ?1 AND o.status = ?2")
    long countByHotelIdAndStatus(Long hotelId, Order.OrderStatus status);

    // Completed orders for history/delete
    List<Order> findByHotelIdAndStatusInOrderByCreatedAtDesc(Long hotelId, List<Order.OrderStatus> statuses);
}
