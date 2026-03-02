package com.ecommerce.service;

import com.ecommerce.model.Order;
import com.ecommerce.model.Payment;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrderRepository orderRepository;

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Optional<Payment> getPaymentById(Integer id) {
        return paymentRepository.findById(id);
    }

    public List<Payment> getPaymentsByOrderId(Integer orderId) {
        return paymentRepository.findByOrder_OrderId(orderId);
    }

    public List<Payment> getPaymentsByStatus(Payment.PaymentStatus status) {
        return paymentRepository.findByPaymentStatus(status);
    }

    public Payment createPayment(Payment payment) {
        // Validate order exists
        if (payment.getOrder() != null && payment.getOrder().getOrderId() != null) {
            Order order = orderRepository.findById(payment.getOrder().getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found"));
            payment.setOrder(order);
        }

        // Validate payment amount
        if (payment.getAmount() == null || payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Payment amount must be greater than zero");
        }

        // Generate transaction ID if not provided
        if (payment.getTransactionId() == null || payment.getTransactionId().isEmpty()) {
            payment.setTransactionId(generateTransactionId(payment.getPaymentMethod()));
        }

        // Set default values
        if (payment.getPaymentDate() == null) {
            payment.setPaymentDate(LocalDateTime.now());
        }
        if (payment.getPaymentStatus() == null) {
            payment.setPaymentStatus(Payment.PaymentStatus.PENDING);
        }

        return paymentRepository.save(payment);
    }

    public Payment processPayment(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getPaymentStatus() == Payment.PaymentStatus.COMPLETED) {
            throw new RuntimeException("Payment is already completed");
        }

        // Simulate payment processing
        payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
        payment.setPaymentDate(LocalDateTime.now());

        // Update order status to CONFIRMED after successful payment
        if (payment.getOrder() != null) {
            Order order = payment.getOrder();
            if (order.getStatus() == Order.OrderStatus.PENDING) {
                order.setStatus(Order.OrderStatus.CONFIRMED);
                orderRepository.save(order);
            }
        }

        return paymentRepository.save(payment);
    }

    public Payment refundPayment(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        if (payment.getPaymentStatus() != Payment.PaymentStatus.COMPLETED) {
            throw new RuntimeException("Only completed payments can be refunded");
        }

        payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
        return paymentRepository.save(payment);
    }

    public Payment failPayment(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new RuntimeException("Payment not found with id: " + paymentId));

        payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
        return paymentRepository.save(payment);
    }

    public BigDecimal getTotalRevenue() {
        return paymentRepository.findByPaymentStatus(Payment.PaymentStatus.COMPLETED)
                .stream()
                .map(Payment::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void deletePayment(Integer id) {
        if (!paymentRepository.existsById(id)) {
            throw new RuntimeException("Payment not found with id: " + id);
        }
        paymentRepository.deleteById(id);
    }

    private String generateTransactionId(String paymentMethod) {
        String prefix = "TXN";
        if (paymentMethod != null) {
            switch (paymentMethod.toUpperCase()) {
                case "UPI": prefix = "TXN_UPI"; break;
                case "CREDIT CARD": prefix = "TXN_CC"; break;
                case "DEBIT CARD": prefix = "TXN_DC"; break;
                case "CASH ON DELIVERY": prefix = "TXN_COD"; break;
                default: prefix = "TXN_OTH"; break;
            }
        }
        return prefix + "_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}