package com.example.dashboard_service.Service;

import com.example.dashboard_service.model.InterventionEvent;
import com.example.dashboard_service.model.dto.InterventionConfirmationDto;
import com.example.dashboard_service.model.dto.NotificationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    // Déclarer le logger
    private static final Logger logger = LoggerFactory.getLogger(NotificationClient.class);

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
                logger.error("Échec de l'envoi de l'événement d'intervention, code: {}", response.getStatusCode());
                throw new RuntimeException("Échec de l'envoi de la notification");
            }
            logger.info("Événement d'intervention envoyé avec succès");
        } catch (Exception e) {
            logger.error("Erreur de communication avec le service de notification: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur de communication avec le service de notification: " + e.getMessage());
        }
    }

    public void sendNotification(NotificationDto notificationDto) {
        logger.info("Envoi de la notification à l'utilisateur {}", notificationDto.getUserId());
        try {
            ResponseEntity<Void> response = restTemplate.exchange(
                    NOTIFICATION_SERVICE_URL,
                    HttpMethod.POST,
                    new HttpEntity<>(notificationDto),
                    Void.class
            );
            logger.info("Réponse du service de notification: {}", response.getStatusCode());
            if (!response.getStatusCode().is2xxSuccessful()) {
                logger.error("Échec de l'envoi de la notification, code: {}", response.getStatusCode());
                throw new RuntimeException("Échec de l'envoi de la notification");
            }
        } catch (Exception e) {
            logger.error("Erreur de communication avec le service de notification: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur de communication avec le service de notification: " + e.getMessage());
        }





    }

    public void sendConfirmationNotification(NotificationDto notificationDto) {
        try {
            logger.info("Envoi de confirmation pour intervention {}", notificationDto.getInterventionId());

            ResponseEntity<Void> response = restTemplate.postForEntity(
                    NOTIFICATION_SERVICE_URL + "/confirm-intervention",
                    notificationDto,
                    Void.class
            );

            if (!response.getStatusCode().is2xxSuccessful()) {
                logger.error("Échec d'envoi de confirmation, code: {}", response.getStatusCode());
            } else {
                logger.info("Confirmation envoyée avec succès pour intervention {}", notificationDto.getInterventionId());
            }
        } catch (Exception e) {
            logger.error("Erreur lors de l'envoi de confirmation pour intervention {}",
                    notificationDto.getInterventionId(), e);
        }
    }





    //pour le demande

}
