// src/main/java/com/daansetu/service/BlockchainService.java
package com.daansetu.service;

import com.daansetu.dto.response.BlockchainResponse;
import com.daansetu.entity.BlockchainTransaction;
import com.daansetu.entity.Donation;
import com.daansetu.exception.ResourceNotFoundException;
import com.daansetu.repository.BlockchainTransactionRepository;
import com.daansetu.util.BlockchainUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BlockchainService {

    private final BlockchainTransactionRepository blockchainRepository;

    @Async
    public void recordDonation(Donation donation) {
        BlockchainTransaction tx = BlockchainTransaction.builder()
                .donation(donation)
                .txHash(BlockchainUtil.generateHash())
                .blockNumber(BlockchainUtil.generateBlockNumber())
                .fromAddress(BlockchainUtil.generateAddress())
                .toAddress(BlockchainUtil.generateAddress())
                .contractAddress(BlockchainUtil.generateAddress())
                .network("Polygon")
                .confirmations(12)
                .status("confirmed")
                .build();

        blockchainRepository.save(tx);
    }

    public BlockchainResponse getBlockchainData(Long donationId) {
        BlockchainTransaction tx = blockchainRepository.findByDonationDonationId(donationId)
                .orElseThrow(() -> new ResourceNotFoundException("Blockchain record", "donationId", donationId));

        List<BlockchainResponse.TrailStep> trail = List.of(
                BlockchainResponse.TrailStep.builder()
                        .step(1).title("Donated").subtitle("Funds sent").status("confirmed")
                        .txHash(tx.getTxHash()).timestamp(tx.getTimestamp()).build(),
                BlockchainResponse.TrailStep.builder()
                        .step(2).title("Received by NGO").subtitle("Funds received").status("confirmed")
                        .txHash(BlockchainUtil.generateHash()).timestamp(tx.getTimestamp().plusMinutes(2)).build(),
                BlockchainResponse.TrailStep.builder()
                        .step(3).title("Allocated to Campaign").subtitle("Funds allocated").status("confirmed")
                        .txHash(BlockchainUtil.generateHash()).timestamp(tx.getTimestamp().plusMinutes(5)).build(),
                BlockchainResponse.TrailStep.builder()
                        .step(4).title("Utilized").subtitle("Impact created").status("confirmed")
                        .txHash(BlockchainUtil.generateHash()).timestamp(tx.getTimestamp().plusHours(1)).build()
        );

        return BlockchainResponse.builder()
                .txHash(tx.getTxHash())
                .blockNumber(tx.getBlockNumber())
                .fromAddress(tx.getFromAddress())
                .toAddress(tx.getToAddress())
                .amount(tx.getDonation().getAmount())
                .status(tx.getStatus())
                .confirmations(tx.getConfirmations())
                .network(tx.getNetwork())
                .timestamp(tx.getTimestamp())
                .donationTrail(trail)
                .build();
    }
}