package com.ecommerce.service;

import com.ecommerce.model.Cancellation;
import com.ecommerce.model.Order;
import com.ecommerce.model.Payment;
import com.ecommerce.repository.CancellationRepository;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CancellationService {

    @Autowired
    private CancellationRepository cancellationRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    public List<Cancellation> getAllCancellations() {
        return cancellationRepository.findAll();
    }

    public Optional<Cancellation> getCancellationById(Integer id) {
        return cancellationRepository.findById(id);
    }

    public Cancellation createCancellation(Cancellation cancellation) {
        // Validate order exists
        if (cancellation.getOrder() != null && cancellation.getOrder().getOrderId() != null) {
            Order order = orderRepository.findById(cancellation.getOrder().getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Check if order can be cancelled
            if (order.getStatus() == Order.OrderStatus.DELIVERED) {
                throw new RuntimeException("Cannot cancel a delivered order");
            }
            if (order.getStatus() == Order.OrderStatus.CANCELLED) {
                throw new RuntimeException("Order is already cancelled");
            }

            // Update order status to CANCELLED
            order.setStatus(Order.OrderStatus.CANCELLED);
            orderRepository.save(order);

            cancellation.setOrder(order);
        }

        // Set defaults
        if (cancellation.getCancelledAt() == null) {
            cancellation.setCancelledAt(LocalDateTime.now());
        }
        if (cancellation.getRefundStatus() == null) {
            cancellation.setRefundStatus(Cancellation.RefundStatus.PENDING);
        }

        return cancellationRepository.save(cancellation);
    }

    public Cancellation processRefund(Integer cancellationId) {
        Cancellation cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new RuntimeException("Cancellation not found"));

        if (cancellation.getRefundStatus() == Cancellation.RefundStatus.COMPLETED) {
            throw new RuntimeException("Refund already completed");
        }

        cancellation.setRefundStatus(Cancellation.RefundStatus.PROCESSED);

        // Also update payment status to REFUNDED
        if (cancellation.getOrder() != null) {
            List<Payment> payments = paymentRepository
                    .findByOrder_OrderId(cancellation.getOrder().getOrderId());
            for (Payment payment : payments) {
                if (payment.getPaymentStatus() == Payment.PaymentStatus.COMPLETED) {
                    payment.setPaymentStatus(Payment.PaymentStatus.REFUNDED);
                    paymentRepository.save(payment);
                }
            }
        }

        return cancellationRepository.save(cancellation);
    }

    public Cancellation completeRefund(Integer cancellationId) {
        Cancellation cancellation = cancellationRepository.findById(cancellationId)
                .orElseThrow(() -> new RuntimeException("Cancellation not found"));

        cancellation.setRefundStatus(Cancellation.RefundStatus.COMPLETED);
        return cancellationRepository.save(cancellation);
    }

    public void deleteCancellation(Integer id) {
        if (!cancellationRepository.existsById(id)) {
            throw new RuntimeException("Cancellation not found with id: " + id);
        }
        cancellationRepository.deleteById(id);
    }
}