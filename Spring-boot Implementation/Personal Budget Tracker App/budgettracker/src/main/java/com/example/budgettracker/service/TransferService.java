package com.example.budgettracker.service;
import com.example.budgettracker.model.Account;
import com.example.budgettracker.model.Transfer;
import com.example.budgettracker.repository.AccountRepository;
import com.example.budgettracker.repository.TransferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class TransferService {

    @Autowired
    private TransferRepository transferRepository;

    @Autowired
    private AccountRepository accountRepository;

    public List<Transfer> getAllTransfers() {
        return transferRepository.findAll();
    }

    public Optional<Transfer> getTransferById(Integer id) {
        return transferRepository.findById(id);
    }

    public List<Transfer> getTransfersByUserId(Integer userId) {
        return transferRepository.findByUserId(userId);
    }

    @Transactional
    public Transfer createTransfer(Transfer transfer) {

        // Validate amount
        if (transfer.getAmount() == null
                || transfer.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Transfer amount must be positive"
            );
        }

        // Validate same account transfer
        if (transfer.getFromAccount().getAccountId()
                .equals(transfer.getToAccount().getAccountId())) {
            throw new IllegalArgumentException(
                    "Cannot transfer to the same account"
            );
        }

        // Fetch fresh accounts from DB
        Account fromAccount = accountRepository
                .findById(transfer.getFromAccount().getAccountId())
                .orElseThrow(() -> new RuntimeException(
                        "Source account not found"
                ));

        Account toAccount = accountRepository
                .findById(transfer.getToAccount().getAccountId())
                .orElseThrow(() -> new RuntimeException(
                        "Destination account not found"
                ));

        BigDecimal fromBalance = fromAccount.getCurrentBalance() != null
                ? fromAccount.getCurrentBalance()
                : BigDecimal.ZERO;

        BigDecimal toBalance = toAccount.getCurrentBalance() != null
                ? toAccount.getCurrentBalance()
                : BigDecimal.ZERO;

        // Check sufficient balance
        if (fromBalance.compareTo(transfer.getAmount()) < 0) {
            throw new RuntimeException(
                    "Insufficient balance in source account. Available: "
                            + fromBalance
            );
        }

        // Deduct from source
        fromAccount.setCurrentBalance(
                fromBalance.subtract(transfer.getAmount())
        );
        accountRepository.save(fromAccount);

        // Add to destination
        toAccount.setCurrentBalance(
                toBalance.add(transfer.getAmount())
        );
        accountRepository.save(toAccount);

        // Set fresh references
        transfer.setFromAccount(fromAccount);
        transfer.setToAccount(toAccount);

        return transferRepository.save(transfer);
    }

    @Transactional
    public void deleteTransfer(Integer id) {

        Transfer transfer = transferRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Transfer not found with ID: " + id
                ));

        // Reverse the transfer
        Account fromAccount = accountRepository
                .findById(transfer.getFromAccount().getAccountId())
                .orElseThrow(() -> new RuntimeException(
                        "Source account not found"
                ));

        Account toAccount = accountRepository
                .findById(transfer.getToAccount().getAccountId())
                .orElseThrow(() -> new RuntimeException(
                        "Destination account not found"
                ));

        BigDecimal fromBalance = fromAccount.getCurrentBalance() != null
                ? fromAccount.getCurrentBalance()
                : BigDecimal.ZERO;

        BigDecimal toBalance = toAccount.getCurrentBalance() != null
                ? toAccount.getCurrentBalance()
                : BigDecimal.ZERO;

        // Reverse: add back to source, deduct from destination
        fromAccount.setCurrentBalance(
                fromBalance.add(transfer.getAmount())
        );
        toAccount.setCurrentBalance(
                toBalance.subtract(transfer.getAmount()).max(BigDecimal.ZERO)
        );

        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        transferRepository.deleteById(id);
    }
}
