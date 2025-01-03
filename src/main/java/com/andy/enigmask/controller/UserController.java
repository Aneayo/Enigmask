package com.andy.enigmask.controller;

import com.andy.enigmask.model.Status;
import com.andy.enigmask.repository.UserRepository;
import com.andy.enigmask.service.UserService;
import com.andy.enigmask.model.User;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.Optional;

@Controller
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @MessageMapping("/user.addUser")
    @SendTo("/user/topic/public")
    public User addUser(
            @Payload User user
    ) {
        userService.saveUser(user);
        return user;
    }

    @MessageMapping("/user.login")
    @SendTo("/user/topic/public")
    public User loginUser(@Payload User user) {
        boolean isAuthenticated = userService.authenticateUser(user.getUsername(), user.getPassword());

        if (isAuthenticated) {
            user.setStatus(Status.ONLINE);
        } else {
            user.setStatus(Status.OFFLINE);
        }
        return user;
    }

    @MessageMapping("/user.disconnectUser")
    @SendTo("/user/topic/public")
    public User disconnectUser(
            @Payload User user
    ) {
        userService.disconnectUser(user);
        return user;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> findConnectedUsers() {
        return ResponseEntity.ok(userService.findConnectedUsers());
    }

}
