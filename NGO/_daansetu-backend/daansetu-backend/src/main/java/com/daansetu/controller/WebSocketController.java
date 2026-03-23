// src/main/java/com/daansetu/controller/WebSocketController.java
package com.daansetu.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    @MessageMapping("/donation.subscribe")
    @SendTo("/topic/donations")
    public Map<String, Object> subscribeDonations(Map<String, Object> message) {
        return Map.of(
                "type", "SUBSCRIBED",
                "message", "Connected to live donation feed",
                "timestamp", System.currentTimeMillis()
        );
    }

    @MessageMapping("/campaign.subscribe")
    @SendTo("/topic/campaigns")
    public Map<String, Object> subscribeCampaigns(Map<String, Object> message) {
        return Map.of(
                "type", "SUBSCRIBED",
                "message", "Connected to campaign updates",
                "timestamp", System.currentTimeMillis()
        );
    }
}