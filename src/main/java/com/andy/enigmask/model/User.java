package com.andy.enigmask.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {

    @Id
    @Column(name = "nickname", nullable = false, unique = true)
    private String nickname; // Primary key

    @Column(name = "fullname", nullable = false)
    private String fullname;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;
}
