package com.ecommerce.repository;

import com.ecommerce.model.DiscountRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DiscountRuleRepository extends JpaRepository<DiscountRule, Integer> {
    List<DiscountRule> findByIsActiveTrue();
}