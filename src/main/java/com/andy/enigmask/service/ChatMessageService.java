package com.andy.enigmask.service;

import com.andy.enigmask.model.ChatMessage;
import com.andy.enigmask.repository.ChatMessageRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatRoomService chatRoomService;
    private static final Logger logger = LoggerFactory.getLogger(ChatMessageService.class);

    @Transactional
    public ChatMessage saveMessage(ChatMessage chatMessage) {
        if (chatMessage == null) {
            throw new IllegalArgumentException("ChatMessage cannot be null");
        }
        if (chatMessage.getSenderId() == null || chatMessage.getRecipientId() == null) {
            throw new IllegalArgumentException("SenderId and RecipientId cannot be null");
        }

        var chatId = chatRoomService.getChatRoomId(
                chatMessage.getSenderId(),
                chatMessage.getRecipientId(),
                true
        ).orElseThrow();

        chatMessage.setChatId(chatId);
        logger.info("Saving message: {}", chatMessage);
        chatMessageRepository.save(chatMessage);

        return chatMessage;
    }

    @Transactional
    public List<ChatMessage> findChatMessages(
            String senderId, String recipientId
    ) {
        var chatId = chatRoomService.getChatRoomId(
                senderId,
                recipientId,
                false
        );
        return chatId.map(chatMessageRepository::findByChatId).orElse(new ArrayList<>());
    }

}
