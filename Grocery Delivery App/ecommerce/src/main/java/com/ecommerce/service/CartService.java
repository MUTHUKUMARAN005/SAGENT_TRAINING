package com.ecommerce.service;

import com.ecommerce.model.Cart;
import com.ecommerce.model.CartItem;
import com.ecommerce.model.Customer;
import com.ecommerce.model.Product;
import com.ecommerce.repository.CartRepository;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.CustomerRepository;
import com.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    public List<Cart> getAllCarts() {
        return cartRepository.findAll();
    }

    public Optional<Cart> getCartById(Integer id) {
        return cartRepository.findById(id);
    }

    public Cart getCartByCustomerId(Integer customerId) {
        return cartRepository.findByCustomer_CustomerId(customerId);
    }

    public Cart createCart(Integer customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + customerId));

        // Check if cart already exists
        Cart existingCart = cartRepository.findByCustomer_CustomerId(customerId);
        if (existingCart != null) {
            return existingCart;
        }

        Cart cart = Cart.builder()
                .customer(customer)
                .build();

        return cartRepository.save(cart);
    }

    public List<CartItem> getCartItems(Integer cartId) {
        return cartItemRepository.findByCart_CartId(cartId);
    }

    public CartItem addItemToCart(Integer cartId, Integer productId, Integer quantity) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        if (quantity == null || quantity <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }

        // Check if product already in cart
        List<CartItem> existingItems = cartItemRepository.findByCart_CartId(cartId);
        for (CartItem item : existingItems) {
            if (item.getProduct().getProductId().equals(productId)) {
                // Update quantity instead of adding new item
                item.setQuantity(item.getQuantity() + quantity);
                item.setPriceAtTime(product.getPrice());
                return cartItemRepository.save(item);
            }
        }

        CartItem cartItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(quantity)
                .priceAtTime(product.getPrice())
                .build();

        return cartItemRepository.save(cartItem);
    }

    public CartItem updateCartItemQuantity(Integer cartItemId, Integer quantity) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartItemId));

        if (quantity <= 0) {
            cartItemRepository.deleteById(cartItemId);
            return null;
        }

        cartItem.setQuantity(quantity);
        return cartItemRepository.save(cartItem);
    }

    public void removeItemFromCart(Integer cartItemId) {
        if (!cartItemRepository.existsById(cartItemId)) {
            throw new RuntimeException("Cart item not found with id: " + cartItemId);
        }
        cartItemRepository.deleteById(cartItemId);
    }

    public void clearCart(Integer cartId) {
        List<CartItem> items = cartItemRepository.findByCart_CartId(cartId);
        cartItemRepository.deleteAll(items);
    }

    public BigDecimal getCartTotal(Integer cartId) {
        List<CartItem> items = cartItemRepository.findByCart_CartId(cartId);
        return items.stream()
                .map(item -> item.getPriceAtTime().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public void deleteCart(Integer id) {
        if (!cartRepository.existsById(id)) {
            throw new RuntimeException("Cart not found with id: " + id);
        }
        // Delete cart items first
        List<CartItem> items = cartItemRepository.findByCart_CartId(id);
        cartItemRepository.deleteAll(items);
        cartRepository.deleteById(id);
    }
}