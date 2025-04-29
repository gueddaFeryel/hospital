package com.example.dashboard_service.Service;

import com.example.dashboard_service.model.TypeIntervention;
import com.example.dashboard_service.model.dto.OperatingRoomDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class RoomManagementService {

    private static final String USER_SERVICE_URL = "http://UserService/api/rooms";

    @Autowired
    @LoadBalanced
    private RestTemplate restTemplate;

    public List<OperatingRoomDTO> getAvailableRooms(LocalDateTime startTime, LocalDateTime endTime, TypeIntervention type) {
        try {
            String category = convertTypeToCategory(type);
            String url = String.format("%s/available?start=%s&end=%s&category=%s",
                    USER_SERVICE_URL,
                    startTime.toString(),
                    endTime.toString(),
                    category);

            ResponseEntity<OperatingRoomDTO[]> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    OperatingRoomDTO[].class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Arrays.asList(response.getBody());
            }
            throw new RuntimeException("Erreur lors de la récupération des salles");
        } catch (Exception e) {
            throw new RuntimeException("Erreur de communication avec le service des salles: " + e.getMessage());
        }
    }

    private String convertTypeToCategory(TypeIntervention type) {
        if (type == null) return "GENERAL";

        switch (type) {
            case CHIRURGIE_CARDIAQUE: return "COEUR";
            case ORTHOPEDIQUE: return "ORTHOPEDIE";
            case NEUROCHIRURGIE: return "NEUROLOGIE";
            case OPHTALMOLOGIQUE: return "YEUX";
            case UROLOGIE:
            case GYNECOLOGIQUE:
            case AUTRE:
            default: return "GENERAL";
        }
    }
}
