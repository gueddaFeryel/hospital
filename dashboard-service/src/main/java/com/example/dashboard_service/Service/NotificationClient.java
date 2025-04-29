package com.example.dashboard_service.Service;

import com.example.dashboard_service.model.InterventionEvent;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class NotificationClient {
    private static final String NOTIFICATION_SERVICE_URL = "http://notification-service/api/notifications";

    @Autowired
    @LoadBalanced
    private RestTemplate restTemplate;

    public void sendInterventionEvent(InterventionEvent event) {
        try {
            ResponseEntity<Void> response = restTemplate.exchange(
                    NOTIFICATION_SERVICE_URL + "/intervention-event",
                    HttpMethod.POST,
                    new HttpEntity<>(event),
                    Void.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Échec de l'envoi de la notification");
            }
        } catch (Exception e) {
            throw new RuntimeException("Erreur de communication avec le service de notification: " + e.getMessage());
        }
    }
}
