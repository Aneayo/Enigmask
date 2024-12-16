package com.andy.enigmask.controller;

import com.andy.enigmask.service.MessageEncryptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class DecryptionController {

    private final MessageEncryptionService encryptionService;

    @PostMapping("/decrypt-message")
    public ResponseEntity<String> decryptMessage(
            @RequestBody Map<String, String> payload
    ) {
        try {
            String encryptedContent = payload.get("encryptedContent");
            String recipientId = payload.get("recipientId");
            String senderId = payload.get("senderId");

            String decryptedContent = encryptionService.decryptMessage(
                    encryptedContent,
                    senderId
            );

            return ResponseEntity.ok(decryptedContent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Decryption failed: " + e.getMessage());
        }
    }
}
