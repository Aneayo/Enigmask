package com.andy.enigmask;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class EnigmaskApplication {

	public static void main(String[] args) {
		SpringApplication.run(EnigmaskApplication.class, args);
	}

}
