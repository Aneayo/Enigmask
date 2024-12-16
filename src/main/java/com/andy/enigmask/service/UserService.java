package com.andy.enigmask.service;

import com.andy.enigmask.repository.UserRepository;
import com.andy.enigmask.model.Status;
import com.andy.enigmask.model.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public boolean authenticateUser(String username, String password) {
        Optional<User> userOptional = userRepository.findByUsername(username);

        if (userOptional.isPresent() && userOptional.get().getPassword().equals(password)) {
            User user = userOptional.get();
            user.setStatus(Status.ONLINE);
            userRepository.save(user); // Save the updated status
            return true;
        }
        return false;
    }


    public void saveUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        } else {
            userRepository.save(user);
            user.setStatus(Status.ONLINE);
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
