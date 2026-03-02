package com.college.admission.service;
import com.college.admission.model.PaymentMethod;
import com.college.admission.repository.PaymentMethodRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PaymentMethodService {

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    public List<PaymentMethod> getAllPaymentMethods() {
        return paymentMethodRepository.findAll();
    }

    public Optional<PaymentMethod> getPaymentMethodById(Integer id) {
        return paymentMethodRepository.findById(id);
    }

    public PaymentMethod createPaymentMethod(PaymentMethod paymentMethod) {
        return paymentMethodRepository.save(paymentMethod);
    }

    public PaymentMethod updatePaymentMethod(Integer id, PaymentMethod paymentMethodDetails) {
        PaymentMethod paymentMethod = paymentMethodRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PaymentMethod not found with id: " + id));
        paymentMethod.setMethodName(paymentMethodDetails.getMethodName());
        return paymentMethodRepository.save(paymentMethod);
    }

    public void deletePaymentMethod(Integer id) {
        if (!paymentMethodRepository.existsById(id)) {
            throw new RuntimeException("PaymentMethod not found with id: " + id);
        }
        paymentMethodRepository.deleteById(id);
    }
}