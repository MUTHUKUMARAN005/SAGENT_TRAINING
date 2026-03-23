// src/main/java/com/daansetu/util/BlockchainUtil.java
package com.daansetu.util;

import java.security.SecureRandom;

public class BlockchainUtil {
    private static final SecureRandom random = new SecureRandom();

    public static String generateHash() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder("0x");
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    public static String generateAddress() {
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder("0x");
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    public static long generateBlockNumber() {
        return 18000000L + random.nextInt(1000000);
    }
}