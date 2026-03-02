package com.example.budgettracker.service;

import com.example.budgettracker.model.Category;
import com.example.budgettracker.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Optional<Category> getCategoryById(Integer id) {
        return categoryRepository.findById(id);
    }

    public List<Category> getCategoriesForUser(Integer userId) {
        return categoryRepository.findByUserIsNullOrUserUserId(userId);
    }

    public List<Category> getCategoriesByType(String type) {
        return categoryRepository.findByCategoryType(type);
    }

    public Category createCategory(Category category) {
        return categoryRepository.save(category);
    }

    public Category updateCategory(Integer id, Category details) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Category not found with ID: " + id
                ));

        category.setCategoryName(details.getCategoryName());
        category.setCategoryType(details.getCategoryType());
        category.setIsCustom(details.getIsCustom());

        return categoryRepository.save(category);
    }

    public void deleteCategory(Integer id) {
        if (!categoryRepository.existsById(id)) {
            throw new RuntimeException("Category not found with ID: " + id);
        }
        categoryRepository.deleteById(id);
    }
}