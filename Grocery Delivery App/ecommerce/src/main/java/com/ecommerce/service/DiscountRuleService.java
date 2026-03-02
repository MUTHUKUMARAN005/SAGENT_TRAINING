package com.ecommerce.service;

import com.ecommerce.model.DiscountRule;
import com.ecommerce.repository.DiscountRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class DiscountRuleService {

    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    public List<DiscountRule> getAllDiscountRules() {
        return discountRuleRepository.findAll();
    }

    public Optional<DiscountRule> getDiscountRuleById(Integer id) {
        return discountRuleRepository.findById(id);
    }

    public List<DiscountRule> getActiveDiscountRules() {
        return discountRuleRepository.findByIsActiveTrue();
    }

    public DiscountRule createDiscountRule(DiscountRule rule) {
        // Validate dates
        if (rule.getValidFrom() != null && rule.getValidTo() != null) {
            if (rule.getValidTo().isBefore(rule.getValidFrom())) {
                throw new RuntimeException("Valid To date must be after Valid From date");
            }
        }

        // Validate amounts
        if (rule.getMinCartValue() != null && rule.getMinCartValue().compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Min cart value cannot be negative");
        }
        if (rule.getDiscountAmount() != null && rule.getDiscountAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Discount amount must be greater than zero");
        }
        if (rule.getDiscountAmount() != null && rule.getMinCartValue() != null &&
                rule.getDiscountAmount().compareTo(rule.getMinCartValue()) >= 0) {
            throw new RuntimeException("Discount amount cannot be greater than or equal to min cart value");
        }

        if (rule.getIsActive() == null) {
            rule.setIsActive(true);
        }

        return discountRuleRepository.save(rule);
    }

    public DiscountRule updateDiscountRule(Integer id, DiscountRule ruleDetails) {
        DiscountRule rule = discountRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount rule not found with id: " + id));

        rule.setMinCartValue(ruleDetails.getMinCartValue());
        rule.setDiscountAmount(ruleDetails.getDiscountAmount());
        rule.setValidFrom(ruleDetails.getValidFrom());
        rule.setValidTo(ruleDetails.getValidTo());
        rule.setIsActive(ruleDetails.getIsActive());

        return discountRuleRepository.save(rule);
    }

    public DiscountRule toggleActive(Integer id) {
        DiscountRule rule = discountRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Discount rule not found"));

        rule.setIsActive(!rule.getIsActive());
        return discountRuleRepository.save(rule);
    }

    /**
     * Find the best applicable discount for a given cart value
     */
    public BigDecimal calculateDiscount(BigDecimal cartValue) {
        LocalDateTime now = LocalDateTime.now();

        return discountRuleRepository.findByIsActiveTrue().stream()
                .filter(rule -> rule.getMinCartValue() != null &&
                        cartValue.compareTo(rule.getMinCartValue()) >= 0)
                .filter(rule -> rule.getValidFrom() == null || !now.isBefore(rule.getValidFrom()))
                .filter(rule -> rule.getValidTo() == null || !now.isAfter(rule.getValidTo()))
                .max(Comparator.comparing(DiscountRule::getDiscountAmount))
                .map(DiscountRule::getDiscountAmount)
                .orElse(BigDecimal.ZERO);
    }

    public void deleteDiscountRule(Integer id) {
        if (!discountRuleRepository.existsById(id)) {
            throw new RuntimeException("Discount rule not found with id: " + id);
        }
        discountRuleRepository.deleteById(id);
    }
}