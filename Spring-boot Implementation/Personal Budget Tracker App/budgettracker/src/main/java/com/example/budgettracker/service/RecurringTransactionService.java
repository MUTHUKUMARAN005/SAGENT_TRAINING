package com.example.budgettracker.service;

import com.example.budgettracker.model.RecurringTransaction;
import com.example.budgettracker.repository.RecurringTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class RecurringTransactionService {

    @Autowired
    private RecurringTransactionRepository repository;

    public List<RecurringTransaction> getAllRecurring() {
        return repository.findAll();
    }

    public Optional<RecurringTransaction> getById(Integer id) {
        return repository.findById(id);
    }

    public List<RecurringTransaction> getByUserId(Integer userId) {
        return repository.findByUserUserId(userId);
    }

    public List<RecurringTransaction> getActiveByUserId(Integer userId) {
        return repository.findByUserUserIdAndIsActive(userId, true);
    }

    public RecurringTransaction create(RecurringTransaction rt) {

        if (rt.getAmount() == null
                || rt.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Amount must be positive"
            );
        }

        return repository.save(rt);
    }

    public RecurringTransaction update(Integer id, RecurringTransaction details) {
        RecurringTransaction rt = repository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Recurring transaction not found with ID: " + id
                ));

        rt.setTransactionType(details.getTransactionType());
        rt.setAmount(details.getAmount());
        rt.setFrequency(details.getFrequency());
        rt.setNextDate(details.getNextDate());
        rt.setIsActive(details.getIsActive());

        return repository.save(rt);
    }

    public void delete(Integer id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException(
                    "Recurring transaction not found with ID: " + id
            );
        }
        repository.deleteById(id);
    }
}