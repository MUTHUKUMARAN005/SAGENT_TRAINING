// File: src/main/java/com/healthcare/controller/MessageController.java
package com.healthcare.controller;

import com.healthcare.model.Message;
import com.healthcare.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Message>> getByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(messageService.getMessagesByUserId(userId));
    }

    @GetMapping("/conversation/{user1Id}/{user2Id}")
    public ResponseEntity<List<Message>> getConversation(@PathVariable Integer user1Id,
                                                         @PathVariable Integer user2Id) {
        return ResponseEntity.ok(messageService.getConversation(user1Id, user2Id));
    }

    @PostMapping
    public ResponseEntity<Message> send(@RequestBody Map<String, Object> body) {
        Integer senderId = (Integer) body.get("senderId");
        Integer receiverId = (Integer) body.get("receiverId");
        String content = (String) body.get("content");
        return ResponseEntity.ok(messageService.sendMessage(senderId, receiverId, content));
    }
}