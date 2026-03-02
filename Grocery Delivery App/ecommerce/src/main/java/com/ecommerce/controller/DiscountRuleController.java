package com.ecommerce.controller;

import com.ecommerce.model.DiscountRule;
import com.ecommerce.repository.DiscountRuleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/discounts")
public class DiscountRuleController {

    @Autowired
    private DiscountRuleRepository discountRuleRepository;

    @GetMapping
    public List<DiscountRule> getAll() { return discountRuleRepository.findAll(); }

    @GetMapping("/active")
    public List<DiscountRule> getActive() { return discountRuleRepository.findByIsActiveTrue(); }

    @PostMapping
    public DiscountRule create(@RequestBody DiscountRule rule) {
        return discountRuleRepository.save(rule);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiscountRule> update(@PathVariable Integer id,
                                               @RequestBody DiscountRule details) {
        return discountRuleRepository.findById(id).map(r -> {
            r.setMinCartValue(details.getMinCartValue());
            r.setDiscountAmount(details.getDiscountAmount());
            r.setValidFrom(details.getValidFrom());
            r.setValidTo(details.getValidTo());
            r.setIsActive(details.getIsActive());
            return ResponseEntity.ok(discountRuleRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        discountRuleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}