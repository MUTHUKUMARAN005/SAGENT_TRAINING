package com.ecommerce.service;

import com.ecommerce.model.Customer;
import com.ecommerce.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    public Optional<Customer> getCustomerById(Integer id) {
        return customerRepository.findById(id);
    }

    public Customer getCustomerByEmail(String email) {
        return customerRepository.findByEmail(email);
    }

    public Customer createCustomer(Customer customer) {
        // Validate unique email
        Customer existing = customerRepository.findByEmail(customer.getEmail());
        if (existing != null) {
            throw new RuntimeException("Customer with email " + customer.getEmail() + " already exists");
        }

        // Set default loyalty points if not provided
        if (customer.getLoyaltyPoints() == null) {
            customer.setLoyaltyPoints(0);
        }

        return customerRepository.save(customer);
    }

    public Customer updateCustomer(Integer id, Customer customerDetails) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        customer.setName(customerDetails.getName());
        customer.setEmail(customerDetails.getEmail());
        customer.setPhone(customerDetails.getPhone());
        customer.setAddress(customerDetails.getAddress());
        customer.setPreferredPaymentMethod(customerDetails.getPreferredPaymentMethod());
        customer.setLoyaltyPoints(customerDetails.getLoyaltyPoints());

        return customerRepository.save(customer);
    }

    public Customer addLoyaltyPoints(Integer id, int points) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        customer.setLoyaltyPoints(currentPoints + points);

        return customerRepository.save(customer);
    }

    public Customer redeemLoyaltyPoints(Integer id, int points) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));

        int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        if (currentPoints < points) {
            throw new RuntimeException("Insufficient loyalty points. Available: " + currentPoints);
        }

        customer.setLoyaltyPoints(currentPoints - points);
        return customerRepository.save(customer);
    }

    public void deleteCustomer(Integer id) {
        if (!customerRepository.existsById(id)) {
            throw new RuntimeException("Customer not found with id: " + id);
        }
        customerRepository.deleteById(id);
    }

    public long getCustomerCount() {
        return customerRepository.count();
    }
}