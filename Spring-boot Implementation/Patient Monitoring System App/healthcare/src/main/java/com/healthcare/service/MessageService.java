// File: src/main/java/com/healthcare/service/MessageService.java
package com.healthcare.service;

import com.healthcare.model.Message;
import com.healthcare.model.User;
import com.healthcare.repository.MessageRepository;
import com.healthcare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public List<Message> getMessagesByUserId(Integer userId) {
        return messageRepository.findByUserId(userId);
    }

    public List<Message> getConversation(Integer user1Id, Integer user2Id) {
        return messageRepository
                .findBySenderUserIdAndReceiverUserIdOrSenderUserIdAndReceiverUserIdOrderBySentAtAsc(
                        user1Id, user2Id, user2Id, user1Id);
    }

    public Message sendMessage(Integer senderId, Integer receiverId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .build();

        return messageRepository.save(message);
    }
}