package com.Project.ProjectZero.service;

import com.Project.ProjectZero.dto.*;
import com.Project.ProjectZero.model.*;
import com.Project.ProjectZero.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {
    private final CustomerSessionRepository sessionRepo;
    private final OrderRepository orderRepo;
    private final BillRepository billRepo;
    private final PaymentRepository paymentRepo;

    @Transactional
    public Bill generateBillForSession(String token) {
        CustomerSession session = sessionRepo.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid session token"));

        if (session.getStatus() == CustomerSession.SessionStatus.PAID) {
            return billRepo.findBySessionId(session.getId())
                    .orElseThrow(() -> new RuntimeException("Bill not found"));
        }

        // Get ALL orders for this session (including any new orders after reactivation)
        List<Order> sessionOrders = orderRepo.findBySessionIdOrderByCreatedAtDesc(session.getId());

        if (sessionOrders.isEmpty()) {
            throw new RuntimeException("No orders found for this session. Please place an order first.");
        }

        // Always recalculate total from ALL session orders (pending + new)
        BigDecimal totalAmount = sessionOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Check if bill already exists for this session
        Bill bill = billRepo.findBySessionId(session.getId()).orElse(null);
        if (bill == null) {
            bill = billRepo.save(Bill.builder()
                    .sessionId(session.getId())
                    .hotelId(session.getHotelId())
                    .totalAmount(totalAmount)
                    .status(Bill.BillStatus.UNPAID)
                    .build());
        } else if (bill.getStatus() != Bill.BillStatus.PAID) {
            // Update total — includes any new orders added after session was reactivated
            bill.setTotalAmount(totalAmount);
            bill.setStatus(Bill.BillStatus.UNPAID); // Reset to UNPAID if was PENDING
            bill = billRepo.save(bill);
        }

        session.setStatus(CustomerSession.SessionStatus.COMPLETED);
        sessionRepo.save(session);

        return bill;
    }

    @Transactional
    public Payment initiatePayment(PaymentRequest req) {
        CustomerSession session = sessionRepo.findByToken(req.getSessionToken())
                .orElseThrow(() -> new RuntimeException("Invalid session token"));

        Bill bill = billRepo.findBySessionId(session.getId())
                .orElseThrow(() -> new RuntimeException("Bill not generated. Please finish dining first."));

        if (bill.getStatus() == Bill.BillStatus.PAID) {
            throw new RuntimeException("Bill already paid");
        }

        Payment.PaymentMethod method = Payment.PaymentMethod.valueOf(req.getPaymentMethod().toUpperCase());

        // Prevent duplicate successful payments
        List<Payment> existingPayments = paymentRepo.findByBillId(bill.getId());
        for (Payment p : existingPayments) {
            if (p.getStatus() == Payment.PaymentStatus.SUCCESS) {
                throw new RuntimeException("Payment already successful");
            }
            // Cancel any old pending payments
            if (p.getStatus() == Payment.PaymentStatus.PENDING && method != Payment.PaymentMethod.CASH) {
                p.setStatus(Payment.PaymentStatus.FAILED);
                paymentRepo.save(p);
            }
        }

        // Fix #15: Removed dead QR fallback code that was never handled

        Payment payment = paymentRepo.save(Payment.builder()
                .billId(bill.getId())
                .sessionId(session.getId())
                .hotelId(session.getHotelId())
                .status(method == Payment.PaymentMethod.CASH ?
                        Payment.PaymentStatus.CASH_PENDING : Payment.PaymentStatus.PENDING)
                .paymentMethod(method)
                .amount(bill.getTotalAmount())
                .attemptCount(existingPayments.size() + 1)
                .build());

        bill.setStatus(Bill.BillStatus.PENDING);
        billRepo.save(bill);

        return payment;
    }

    @Transactional
    public Payment verifyPayment(PaymentVerifyRequest req) {
        Payment payment = paymentRepo.findById(req.getPaymentId())
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() == Payment.PaymentStatus.SUCCESS) {
            return payment;
        }

        if (req.getUpiTransactionId() == null || req.getUpiTransactionId().isEmpty()) {
            payment.setStatus(Payment.PaymentStatus.FAILED);
            return paymentRepo.save(payment);
        }

        payment.setUpiTransactionId(req.getUpiTransactionId());
        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        payment = paymentRepo.save(payment);

        Bill bill = billRepo.findById(payment.getBillId())
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        bill.setStatus(Bill.BillStatus.PAID);
        billRepo.save(bill);

        CustomerSession session = sessionRepo.findById(payment.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus(CustomerSession.SessionStatus.PAID);
        sessionRepo.save(session);

        return payment;
    }

    @Transactional
    public Payment manualConfirmAsAdmin(String paymentId) {
        Payment payment = paymentRepo.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(Payment.PaymentStatus.SUCCESS);
        payment = paymentRepo.save(payment);

        Bill bill = billRepo.findById(payment.getBillId())
                .orElseThrow(() -> new RuntimeException("Bill not found"));
        bill.setStatus(Bill.BillStatus.PAID);
        billRepo.save(bill);

        CustomerSession session = sessionRepo.findById(payment.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus(CustomerSession.SessionStatus.PAID);
        sessionRepo.save(session);

        return payment;
    }

    // For admin: confirm cash payment by order ref
    @Transactional
    public Payment confirmCashByOrderRef(String orderRef) {
        Order order = orderRepo.findByOrderRef(orderRef)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderRef));

        Bill bill = billRepo.findBySessionId(order.getSessionId())
                .orElseThrow(() -> new RuntimeException("No bill found for this order's session"));

        if (bill.getStatus() == Bill.BillStatus.PAID) {
            throw new RuntimeException("Bill already paid");
        }

        // Find pending cash payment or create one
        List<Payment> payments = paymentRepo.findByBillId(bill.getId());
        Payment cashPayment = payments.stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.CASH_PENDING)
                .findFirst()
                .orElse(null);

        if (cashPayment == null) {
            cashPayment = paymentRepo.save(Payment.builder()
                    .billId(bill.getId())
                    .sessionId(order.getSessionId())
                    .hotelId(order.getHotelId())
                    .status(Payment.PaymentStatus.SUCCESS)
                    .paymentMethod(Payment.PaymentMethod.CASH)
                    .amount(bill.getTotalAmount())
                    .build());
        } else {
            cashPayment.setStatus(Payment.PaymentStatus.SUCCESS);
            cashPayment = paymentRepo.save(cashPayment);
        }

        bill.setStatus(Bill.BillStatus.PAID);
        billRepo.save(bill);

        CustomerSession session = sessionRepo.findById(bill.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));
        session.setStatus(CustomerSession.SessionStatus.PAID);
        sessionRepo.save(session);

        // Mark all orders in session as PAID
        List<Order> orders = orderRepo.findBySessionIdOrderByCreatedAtDesc(session.getId());
        for (Order o : orders) {
            o.setStatus(Order.OrderStatus.PAID);
            o.setPaidVia("CASH");
            orderRepo.save(o);
        }

        return cashPayment;
    }
}
