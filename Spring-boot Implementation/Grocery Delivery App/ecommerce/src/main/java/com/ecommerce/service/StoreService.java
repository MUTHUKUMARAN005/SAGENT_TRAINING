package com.ecommerce.service;

import com.ecommerce.model.Store;
import com.ecommerce.model.User;
import com.ecommerce.repository.StoreRepository;
import com.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class StoreService {

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Store> getAllStores() {
        return storeRepository.findAll();
    }

    public Optional<Store> getStoreById(Integer id) {
        return storeRepository.findById(id);
    }

    public Store createStore(Store store) {
        // Validate manager exists and is a MANAGER type
        if (store.getStoreManager() != null && store.getStoreManager().getUserId() != null) {
            User manager = userRepository.findById(store.getStoreManager().getUserId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));

            if (manager.getUserType() != User.UserType.MANAGER &&
                    manager.getUserType() != User.UserType.ADMIN) {
                throw new RuntimeException("Assigned user must be a MANAGER or ADMIN");
            }
            store.setStoreManager(manager);
        }

        return storeRepository.save(store);
    }

    public Store updateStore(Integer id, Store storeDetails) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Store not found with id: " + id));

        store.setStoreName(storeDetails.getStoreName());
        store.setStoreAddress(storeDetails.getStoreAddress());
        store.setContactNumber(storeDetails.getContactNumber());

        if (storeDetails.getStoreManager() != null) {
            User manager = userRepository.findById(storeDetails.getStoreManager().getUserId())
                    .orElseThrow(() -> new RuntimeException("Manager not found"));
            store.setStoreManager(manager);
        }

        return storeRepository.save(store);
    }

    public void deleteStore(Integer id) {
        if (!storeRepository.existsById(id)) {
            throw new RuntimeException("Store not found with id: " + id);
        }
        storeRepository.deleteById(id);
    }

    public long getStoreCount() {
        return storeRepository.count();
    }
}