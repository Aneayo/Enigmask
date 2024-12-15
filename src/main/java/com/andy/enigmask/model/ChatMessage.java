package com.andy.enigmask.model;

import lombok.*;

import jakarta.persistence.*;
import java.util.Date;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "chat_id", nullable = false)
    private String chatId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "recipient_id", nullable = false)
    private String recipientId;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;             // Message content TODO: Encrypting content

    @Column(name = "timestamp", nullable = false)
    private Date timestamp;

}
