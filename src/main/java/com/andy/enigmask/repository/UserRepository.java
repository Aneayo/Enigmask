package com.andy.enigmask.repository;

import com.andy.enigmask.model.Status;
import com.andy.enigmask.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, String> {

    // find users by their status
    List<User> findAllByStatus(Status status);

    Optional<User> findByUsername(String username);

}
