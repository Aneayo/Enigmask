package com.andy.enigmask.service;

import com.andy.enigmask.repository.UserRepository;
import com.andy.enigmask.model.Status;
import com.andy.enigmask.model.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public void saveUser(User user) {
        user.setStatus(Status.ONLINE);
        System.out.println("Attempting to save user: " + user.getUsername());
        try {
            userRepository.save(user);
            System.out.println("User saved successfully: " + user.getUsername());
        } catch (Exception e) {
            System.err.println("Error saving user: " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void disconnectUser(User user) {
        var storedUser = userRepository
                .findById(user.getUsername())
                .orElse(null);

        if (storedUser != null) {
            storedUser.setStatus(Status.OFFLINE);
            userRepository.save(storedUser);
        }
    }

    public List<User> findConnectedUsers() {
        return userRepository.findAllByStatus(Status.ONLINE);
    }

}
