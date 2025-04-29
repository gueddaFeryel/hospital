package com.example.dashboard_service.Controller;




import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MaterielRepository;
import com.example.dashboard_service.Service.EmailService;
import com.example.dashboard_service.Service.InterventionService;
import com.example.dashboard_service.Service.RoomManagementService;
import com.example.dashboard_service.model.*;
import com.example.dashboard_service.model.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/interventions")
public class InterventionController {
    @Autowired
    private InterventionService interventionService;
    @Autowired
    private EmailService emailService;
    @Autowired
    private InterventionRepository interventionRepository;

    @Autowired
    private RoomManagementService roomManagementService;
    @Autowired
    private MaterielRepository materielRepository;


    // In InterventionController.java
    @GetMapping("/by-staff/{staffId}")
    public ResponseEntity<List<InterventionChirurgicale>> getInterventionsByStaff(@PathVariable Long staffId) {
        List<InterventionChirurgicale> interventions = interventionRepository.findByEquipeMedicaleId(staffId);
        return ResponseEntity.ok(interventions);
    }



    @GetMapping("/available-rooms")
    public ResponseEntity<List<OperatingRoomDTO>> getAvailableRooms(
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam String type) {

        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);

        List<OperatingRoomDTO> availableRooms = roomManagementService.getAvailableRooms(start, end, TypeIntervention.valueOf(type));
        return ResponseEntity.ok(availableRooms);
    }
    @PostMapping("/with-room")
    public ResponseEntity<?> createInterventionWithRoom(
            @RequestBody InterventionRequest request) {
        try {
            // Vérifier disponibilité salle
            List<OperatingRoomDTO> availableRooms = roomManagementService.getAvailableRooms(
                    request.getStartTime() != null ? request.getStartTime() : request.getDate().atStartOfDay(),
                    request.getEndTime() != null ? request.getEndTime() : request.getDate().atTime(23, 59),
                    request.getType()
            );

            if (request.getRoomId() != null &&
                    availableRooms.stream().noneMatch(r -> r.getId().equals(request.getRoomId()))) {
                return ResponseEntity.badRequest().body("Salle non disponible");
            }

            InterventionChirurgicale intervention = new InterventionChirurgicale();
            intervention.setDate(request.getDate());
            intervention.setStatut(request.getStatut());
            intervention.setType(request.getType());
            intervention.setRoomId(request.getRoomId());
            intervention.setStartTime(request.getStartTime());
            intervention.setEndTime(request.getEndTime());


            InterventionChirurgicale saved = interventionService.creerIntervention(intervention);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }


    @GetMapping
    public List<InterventionChirurgicale> getAllInterventions() {
        return interventionService.getAllInterventions();
    }

    @GetMapping("/date/{date}")
    public List<InterventionChirurgicale> getInterventionsParDate(
            @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        return interventionService.getInterventionsParDate(localDate);
    }

    @GetMapping("/statut/{statut}")
    public List<InterventionChirurgicale> getInterventionsParStatut(
            @PathVariable StatutIntervention statut) {
        return interventionService.getInterventionsParStatut(statut);
    }

    @GetMapping("/type/{type}")
    public List<InterventionChirurgicale> getInterventionsParType(
            @PathVariable TypeIntervention type) {
        return interventionService.getInterventionsParType(type);
    }

    @GetMapping("/periode")
    public List<InterventionChirurgicale> getInterventionsEntreDates(
            @RequestParam String debut,
            @RequestParam String fin) {
        LocalDate dateDebut = LocalDate.parse(debut);
        LocalDate dateFin = LocalDate.parse(fin);
        return interventionService.getInterventionsEntreDates(dateDebut, dateFin);
    }




    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerIntervention(@PathVariable Long id) {
        interventionService.supprimerIntervention(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterventionChirurgicale> getInterventionById(@PathVariable Long id) {
        return interventionService.getInterventionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


    @PatchMapping("/{id}/assign-room")
    public ResponseEntity<?> assignRoomToIntervention(
            @PathVariable Long id,
            @RequestParam Long roomId) {

        try {
            // Vérifier que la salle est disponible
            InterventionChirurgicale intervention = interventionService.getInterventionById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

            List<OperatingRoomDTO> availableRooms = roomManagementService.getAvailableRooms(
                    intervention.getStartTime() != null ? intervention.getStartTime() : intervention.getDate().atStartOfDay(),
                    intervention.getEndTime() != null ? intervention.getEndTime() : intervention.getDate().atTime(23, 59),
                    intervention.getType()
            );

            if (availableRooms.stream().noneMatch(r -> r.getId().equals(roomId))) {
                return ResponseEntity.badRequest().body("La salle sélectionnée n'est pas disponible");
            }

            // Mettre à jour seulement le roomId
            InterventionChirurgicale updated = interventionService.modifierIntervention(id,
                    Map.of("roomId", roomId));

            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de l'attribution: " + e.getMessage());
        }
    }

    // Ajoutez ces méthodes à InterventionController
    @PostMapping("/{id}/assign-materiel")
    public ResponseEntity<?> assignMaterielToIntervention(
            @PathVariable Long id,
            @RequestBody List<MaterielAssignmentDTO> assignments) {
        try {
            // Validation des données
            if (assignments == null || assignments.isEmpty()) {
                return ResponseEntity.badRequest().body("La liste des matériels ne peut pas être vide");
            }

            for (MaterielAssignmentDTO assignment : assignments) {
                if (assignment.getQuantity() == null || assignment.getQuantity() <= 0) {
                    return ResponseEntity.badRequest().body("La quantité doit être supérieure à 0");
                }
            }

            InterventionChirurgicale intervention = interventionService
                    .assignerMaterielAvecQuantite(id, assignments);

            return ResponseEntity.ok(intervention);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur serveur: " + e.getMessage());
        }
    }
    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> completeIntervention(@PathVariable Long id) {
        try {
            // 1. Marquer l'intervention comme terminée
            InterventionChirurgicale intervention = interventionService.modifierIntervention(
                    id,
                    Map.of("statut", StatutIntervention.TERMINEE)
            );

            // 2. Remettre les matériels dans le stock
            interventionService.returnMaterielsToStock(id);

            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur: " + e.getMessage());
        }
    }
    @GetMapping("/{id}/materiels")
    public ResponseEntity<Set<Materiel>> getMaterielsForIntervention(@PathVariable Long id) {
        return interventionService.getInterventionById(id)
                .map(intervention -> ResponseEntity.ok(intervention.getMateriels()))
                .orElse(ResponseEntity.notFound().build());
    }
    @PutMapping("/{id}/update-materiel")
    public ResponseEntity<?> updateMaterielForIntervention(
            @PathVariable Long id,
            @RequestBody Set<Long> materielIds) {
        try {
            // Vérifier la disponibilité des nouveaux matériels
            Map<Long, Integer> unavailableMateriels = interventionService.checkMaterielAvailability(materielIds);

            if (!unavailableMateriels.isEmpty()) {
                return ResponseEntity.badRequest().body(
                        "Quantité insuffisante pour les matériels: " +
                                unavailableMateriels.entrySet().stream()
                                        .map(e -> "ID " + e.getKey() + " (manque " + e.getValue() + ")")
                                        .collect(Collectors.joining(", "))
                );
            }

            // Récupérer l'intervention actuelle pour retourner les anciens matériels
            InterventionChirurgicale currentIntervention = interventionService.getInterventionById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

            // Si l'intervention n'est pas terminée, retourner les anciens matériels au stock
            if (currentIntervention.getStatut() != StatutIntervention.TERMINEE) {
                for (Materiel materiel : currentIntervention.getMateriels()) {
                    materiel.setQuantiteDisponible(materiel.getQuantiteDisponible() + 1);
                    materielRepository.save(materiel);
                }
            }
            // Mettre à jour avec les nouveaux matériels
            InterventionChirurgicale intervention = interventionService.updateMaterielForIntervention(id, materielIds);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/staff")
    public ResponseEntity<Set<MedicalStaff>> getMedicalStaffForIntervention(@PathVariable Long id) {
        Set<MedicalStaff> staff = interventionService.getEquipeMedicale(id);
        return ResponseEntity.ok(staff);
    }

    @GetMapping("/available-staff")
    public ResponseEntity<?> getAvailableStaff(
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam RoleMedical role) {

        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);

        List<MedicalStaff> availableStaff = interventionService.findAvailableStaff(start, end, role);
        return ResponseEntity.ok(availableStaff);
    }


    @PostMapping("/{id}/assign-staff")
    public ResponseEntity<?> assignMedicalStaff(
            @PathVariable Long id,
            @RequestBody Map<RoleMedical, Long> staffAssignments) {

        try {
            // Utilisez la version avec vérification de disponibilité
            InterventionChirurgicale intervention = interventionService.assignerStaffAvecDisponibilite(id, staffAssignments);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Autowired
    private RestTemplate restTemplate;

    private  static final Logger log = LoggerFactory.getLogger(InterventionController.class);
    @PutMapping("/{id}")
    public ResponseEntity<InterventionChirurgicale> modifierIntervention(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {

        InterventionChirurgicale intervention = interventionService.getInterventionById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        InterventionChirurgicale interventionModifiee = interventionService.modifierIntervention(id, updates);

        envoyerNotificationsEquipeActuelle(interventionModifiee);

        return ResponseEntity.ok(interventionModifiee);
    }

    private void envoyerNotificationsEquipeActuelle(InterventionChirurgicale intervention) {
        Set<MedicalStaff> equipeMedicale = intervention.getEquipeMedicale();

        if (equipeMedicale == null || equipeMedicale.isEmpty()) {
            return;
        }

        String message = buildNotificationMessage(intervention);

        for (MedicalStaff staff : equipeMedicale) {
            if (staff.getEmail() != null) { // Vérification de la présence de l'email
                try {
                    emailService.sendEmail(staff.getEmail(),
                            "Intervention modifiée - " + intervention.getId(),
                            message);
                    log.info("Email envoyé à {}", staff.getEmail());
                } catch (Exception e) {
                    log.error("Erreur lors de l'envoi de l'email à {}", staff.getEmail(), e);
                }
            } else {
                log.warn("Le staff {} n'a pas d'email associé", staff.getId());
            }
        }
    }


    private String buildNotificationMessage(InterventionChirurgicale intervention) {
        return "L'intervention #" + intervention.getId() + " a été modifiée. " +
                "Nouveau statut: " + intervention.getStatut() + ". " +
                "Date: " + intervention.getDate() + ". " +
                "Salle: " + intervention.getRoomId();
    }

    private Notification createNotification(InterventionChirurgicale intervention, String message, String userId) {
        Notification notification = new Notification();
        notification.setInterventionId(intervention.getId());
        notification.setUserId(userId);
        notification.setMessage(message);
        notification.setTimestamp(System.currentTimeMillis());
        return notification;
    }

    private void envoyerNotification(Notification notification) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            HttpEntity<Notification> request = new HttpEntity<>(notification, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    "http://notification-service/api/notifications",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null && "success".equals(responseBody.get("status"))) {
                    log.info("Notification envoyée avec succès à {}", notification.getUserId());
                } else {
                    log.warn("Réponse inattendue du service de notification: {}", responseBody);
                    enregistrerNotificationPourRetry(notification);
                }
            } else {
                log.error("Échec d'envoi - Code: {}", response.getStatusCode());
                enregistrerNotificationPourRetry(notification);
            }

        } catch (ResourceAccessException e) {
            log.error("Timeout ou service inaccessible: {}", e.getMessage());
            enregistrerNotificationPourRetry(notification);
        } catch (Exception e) {
            log.error("Erreur inattendue: {}", e.getMessage());
        }
    }

    private void enregistrerNotificationPourRetry(Notification notification) {
        try {
            log.warn("Notification pour l'utilisateur {} mise en attente", notification.getUserId());
        } catch (Exception e) {
            log.error("Échec de l'enregistrement pour réessai: {}", e.getMessage());
        }
    }
}
















