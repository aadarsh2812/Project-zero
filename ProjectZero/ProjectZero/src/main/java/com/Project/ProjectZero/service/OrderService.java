package com.Project.ProjectZero.service;

import com.Project.ProjectZero.dto.OrderRequest;
import com.Project.ProjectZero.model.*;
import com.Project.ProjectZero.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepo;
    private final OrderItemRepository orderItemRepo;
    private final MenuItemRepository menuItemRepo;
    private final CustomerRepository customerRepo;
    private final RedisService redisService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public Order placeOrder(OrderRequest req) {
        // Validate customer session
        Customer customer = customerRepo.findByToken(req.getCustomerToken())
                .orElseThrow(() -> new RuntimeException("Invalid customer token"));

        // Generate ORD-XXX reference
        long count = orderRepo.countByHotelId(req.getHotelId()) + 1;
        String orderRef = String.format("ORD-%03d", count);

        // Build order
        Order order = orderRepo.save(Order.builder()
                .orderRef(orderRef)
                .customerId(customer.getId())
                .tableNo(req.getTableNo())
                .hotelId(req.getHotelId())
                .status(Order.OrderStatus.RECEIVED)
                .totalAmount(BigDecimal.ZERO)
                .build());

        // Build items & calculate total
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (OrderRequest.OrderItemRequest ir : req.getItems()) {
            MenuItem menuItem = menuItemRepo.findById(ir.getMenuItemId())
                    .orElseThrow(() -> new RuntimeException("Menu item not found: " + ir.getMenuItemId()));
            BigDecimal linePrice = menuItem.getPrice().multiply(BigDecimal.valueOf(ir.getQuantity()));
            total = total.add(linePrice);
            items.add(orderItemRepo.save(OrderItem.builder()
                    .orderId(order.getId())
                    .menuItemId(menuItem.getId())
                    .itemName(menuItem.getName())
                    .quantity(ir.getQuantity())
                    .price(menuItem.getPrice())
                    .build()));
        }

        order.setTotalAmount(total);
        order.setItems(items);
        order = orderRepo.save(order);

        // Publish to Redis Pub/Sub → triggers WebSocket push in subscriber
        redisService.publishKitchenEvent(req.getHotelId(), buildKitchenPayload(order, customer));

        log.info("Order {} placed for table {} in hotel {}", orderRef, req.getTableNo(), req.getHotelId());
        return order;
    }

    @Transactional
    public Order updateStatus(String orderRef, String status, String paidVia) {
        Order order = orderRepo.findByOrderRef(orderRef)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderRef));

        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        order.setStatus(newStatus);
        if (paidVia != null) order.setPaidVia(paidVia);
        order = orderRepo.save(order);

        // Push status update to customer via WebSocket
        Customer customer = customerRepo.findById(order.getCustomerId()).orElse(null);
        Map<String, Object> update = new HashMap<>();
        update.put("orderRef", orderRef);
        update.put("status", newStatus.name());
        update.put("tableNo", order.getTableNo());
        String customerTopic = "/topic/customer/" + order.getCustomerId() + "/status";
        messagingTemplate.convertAndSend(customerTopic, (Object) update);

        // Push updated kitchen order
        if (customer != null) {
            String kitchenTopic = "/topic/hotel/" + order.getHotelId() + "/kitchen";
            messagingTemplate.convertAndSend(kitchenTopic, (Object) buildKitchenPayload(order, customer));
        }

        return order;
    }

    public List<Order> getActiveOrders(Long hotelId) {
        return orderRepo.findByHotelIdAndStatusIn(hotelId,
                List.of(Order.OrderStatus.RECEIVED, Order.OrderStatus.PREPARING, Order.OrderStatus.READY));
    }

    public List<Order> getAllOrders(Long hotelId) {
        return orderRepo.findByHotelIdOrderByCreatedAtDesc(hotelId);
    }

    public List<Order> getCustomerOrders(String token) {
        Customer customer = customerRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));
        return orderRepo.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
    }

    public Optional<Order> findByRef(String orderRef) {
        return orderRepo.findByOrderRef(orderRef);
    }

    private Map<String, Object> buildKitchenPayload(Order order, Customer customer) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("orderId", order.getId());
        payload.put("orderRef", order.getOrderRef());
        payload.put("tableNo", order.getTableNo());
        payload.put("hotelId", order.getHotelId());
        payload.put("status", order.getStatus().name());
        payload.put("totalAmount", order.getTotalAmount());
        payload.put("customerName", customer.getName());
        payload.put("createdAt", order.getCreatedAt() != null ? order.getCreatedAt().toString() : "");
        payload.put("items", order.getItems().stream().map(i -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", i.getItemName());
            m.put("quantity", i.getQuantity());
            m.put("price", i.getPrice());
            return m;
        }).toList());
        return payload;
    }
}
