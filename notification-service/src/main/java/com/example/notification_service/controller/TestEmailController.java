package com.example.notification_service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
public class TestEmailController {

    @Autowired
    private JavaMailSender mailSender;

    @GetMapping("/email")
    public String testEmail() {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo("nadanefzi223@gmail.com");
            message.setSubject("Test SSL");
            message.setText("Ceci est un test");
            mailSender.send(message);
            return "Email envoyé";
        } catch (Exception e) {
            return "Échec : " + e.getMessage();
        }
    }
}
