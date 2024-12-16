package com.andy.enigmask.service;

import com.andy.enigmask.model.ChatMessage;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class MessageEncryptionService {

    private static final Map<String, String> USER_ENCRYPTION_KEYS = new HashMap<>();

    private SecretKeySpec generateKey(String username) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(username.getBytes(StandardCharsets.UTF_8));

        byte[] keyBytes = new byte[16];
        System.arraycopy(hash, 0, keyBytes, 0, 16);

        return new SecretKeySpec(keyBytes, "AES");
    }

    public String encryptMessage(String content, String username) {
        try {
            SecretKeySpec secretKey = generateKey(username);
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);

            byte[] encryptedBytes = cipher.doFinal(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }

    public String decryptMessage(String encryptedContent, String username) {
        try {
            SecretKeySpec secretKey = generateKey(username);
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);

            byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedContent));
            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }

    public ChatMessage prepareEncryptedMessage(ChatMessage chatMessage) {
        String encryptedContent = encryptMessage(
                chatMessage.getContent(),
                chatMessage.getSenderId()
        );
        chatMessage.setContent(encryptedContent);
        return chatMessage;
    }

    public ChatMessage decryptRetrievedMessage(ChatMessage chatMessage, String recipientUsername) {
        try {
            String decryptedContent = decryptMessage(
                    chatMessage.getContent(),
                    chatMessage.getSenderId()
            );
            chatMessage.setContent(decryptedContent);
            return chatMessage;
        } catch (Exception e) {
            System.err.println("Decryption failed for message: " + e.getMessage());
            return chatMessage;
        }
    }
}
