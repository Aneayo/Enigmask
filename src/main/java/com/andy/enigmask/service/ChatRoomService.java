package com.andy.enigmask.service;

import com.andy.enigmask.model.ChatRoom;
import com.andy.enigmask.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatRoomService {

    private final ChatRoomRepository chatRoomRepository;

    public Optional<String> getChatRoomId(String senderId, String recipientId, boolean createNewRoomIfNotExist) {
        // Sort sender and recipient to ensure consistent query
        String sortedSenderId = senderId.compareTo(recipientId) < 0 ? senderId : recipientId;
        String sortedRecipientId = senderId.compareTo(recipientId) < 0 ? recipientId : senderId;

        return chatRoomRepository
                .findBySenderIdAndRecipientId(sortedSenderId, sortedRecipientId)
                .map(ChatRoom::getChatId)
                .or(() -> {
                    if (createNewRoomIfNotExist) {
                        var chatId = createChatId(sortedSenderId, sortedRecipientId);
                        return Optional.of(chatId);
                    }
                    return Optional.empty();
                });
    }


    private String createChatId(String senderId, String recipientId) {
        // Sort sender and recipient to ensure consistent chatId
        String sortedSenderId = senderId.compareTo(recipientId) < 0 ? senderId : recipientId;
        String sortedRecipientId = senderId.compareTo(recipientId) < 0 ? recipientId : senderId;
        String chatId = String.format("%s_%s", sortedSenderId, sortedRecipientId);

        // Check if the chat already exists
        if (chatRoomRepository.findBySenderIdAndRecipientId(sortedSenderId, sortedRecipientId).isEmpty()) {
            ChatRoom chatRoom = ChatRoom.builder()
                    .chatId(chatId)
                    .senderId(sortedSenderId)
                    .recipientId(sortedRecipientId)
                    .build();

            chatRoomRepository.save(chatRoom);
        }

        return chatId;
    }

}
