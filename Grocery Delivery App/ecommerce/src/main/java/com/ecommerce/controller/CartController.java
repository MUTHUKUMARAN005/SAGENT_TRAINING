package com.ecommerce.controller;

import com.ecommerce.model.Cart;
import com.ecommerce.model.CartItem;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.CartItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/carts")
public class CartController {

    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;

    @GetMapping
    public List<Cart> getAll() { return cartRepository.findAll(); }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<Cart> getByCustomer(@PathVariable Integer customerId) {
        Cart cart = cartRepository.findByCustomer_CustomerId(customerId);
        return cart != null ? ResponseEntity.ok(cart) : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/items")
    public List<CartItem> getCartItems(@PathVariable Integer id) {
        return cartItemRepository.findByCart_CartId(id);
    }

    @PostMapping
    public Cart create(@RequestBody Cart cart) { return cartRepository.save(cart); }

    @PostMapping("/items")
    public CartItem addItem(@RequestBody CartItem item) { return cartItemRepository.save(item); }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> removeItem(@PathVariable Integer id) {
        cartItemRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}