// File: src/main/java/com/healthcare/repository/MessageRepository.java
package com.healthcare.repository;

import com.healthcare.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Integer> {
    @Query("SELECT m FROM Message m WHERE m.sender.userId = ?1 OR m.receiver.userId = ?1 ORDER BY m.sentAt DESC")
    List<Message> findByUserId(Integer userId);

    List<Message> findBySenderUserIdAndReceiverUserIdOrSenderUserIdAndReceiverUserIdOrderBySentAtAsc(
            Integer sender1, Integer receiver1, Integer sender2, Integer receiver2);
}