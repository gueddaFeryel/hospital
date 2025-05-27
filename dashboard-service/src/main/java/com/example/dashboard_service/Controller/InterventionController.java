package com.example.dashboard_service.Controller;
import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MaterielRepository;
import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.Repository.PatientRepository;
import com.example.dashboard_service.Service.EmailService;
import com.example.dashboard_service.Service.InterventionService;
import com.example.dashboard_service.Service.NotificationClient;
import com.example.dashboard_service.Service.RoomManagementService;
import com.example.dashboard_service.model.*;
import com.example.dashboard_service.model.dto.*;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;


import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
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
  private  NotificationClient notificationClient;
    @Autowired
    private RoomManagementService roomManagementService;
    @Autowired
    private MaterielRepository materielRepository;
    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private RestTemplate restTemplate;
@Autowired
private MedicalStaffRepository medicalStaffRepository;
    // Déclarer le logger
    private static final Logger logger = LoggerFactory.getLogger(InterventionController.class);
    // In InterventionController.java
    @GetMapping("/by-staff/{staffId}")
    public ResponseEntity<List<InterventionChirurgicale>> getInterventionsByStaff(@PathVariable Long staffId) {
        List<InterventionChirurgicale> interventions = interventionRepository.findByEquipeMedicaleId(staffId);
        logger.info("Fetched {} interventions for staffId={}", interventions != null ? interventions.size() : 0, staffId);
        return ResponseEntity.ok(interventions != null ? interventions : Collections.emptyList());
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
    public ResponseEntity<Page<InterventionDTO>> getAllInterventions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<InterventionDTO> interventionPage = interventionService.getAllInterventions(pageable);
            return ResponseEntity.ok(interventionPage);
        } catch (Exception e) {
            logger.error("Error fetching interventions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
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

    @GetMapping("/types")
    public ResponseEntity<List<String>> getInterventionTypes() {
        try {
            // Récupérer tous les types d'intervention disponibles
            List<String> types = Arrays.stream(TypeIntervention.values())
                    .map(Enum::name)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(types);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des types d'intervention", e);
            return ResponseEntity.internalServerError().build();
        }
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
            @RequestBody Set<Long> materielIds) {
        try {
            // Validation préalable
            if (materielIds == null || materielIds.isEmpty()) {
                return ResponseEntity.badRequest().body("Aucun matériel spécifié");
            }

            InterventionChirurgicale intervention = interventionService.assignerMateriel(id, materielIds);
            return ResponseEntity.ok(intervention);
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de l'assignation: " + e.getMessage());
        }
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<?> completeIntervention(@PathVariable Long id) {
        try {
            InterventionChirurgicale intervention = interventionService.completeIntervention(id);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur lors de la complétion: " + e.getMessage());
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

            // Utiliser assignerMateriel au lieu de updateMaterielForIntervention
            InterventionChirurgicale intervention = interventionService.assignerMateriel(id, materielIds);
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
            @RequestBody Map<RoleMedical, List<Long>> staffAssignments) {  // Changez Long en List<Long>

        try {
            InterventionChirurgicale intervention = interventionService.assignerStaffMultiple(id, staffAssignments);
            return ResponseEntity.ok(intervention);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    private static final Logger log = LoggerFactory.getLogger(InterventionController.class);

    @PutMapping("/{id}")
    public ResponseEntity<InterventionChirurgicale> modifierIntervention(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {

        InterventionChirurgicale intervention = interventionService.getInterventionById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        InterventionChirurgicale interventionModifiee = interventionService.modifierIntervention(id, updates);

        // Envoyer les notifications
        envoyerNotificationsModification(interventionModifiee); // Utilisez la méthode existante
        envoyerEmailsEquipe(interventionModifiee); // Ajoutez cette nouvelle méthode

        return ResponseEntity.ok(interventionModifiee);
    }

    // Ajoutez cette nouvelle méthode
    private void envoyerEmailsEquipe(InterventionChirurgicale intervention) {
        String message = buildNotificationMessage(intervention);

        for (MedicalStaff staff : intervention.getEquipeMedicale()) {
            if (staff.getEmail() != null) {
                try {
                    emailService.sendEmail(
                            staff.getEmail(),
                            "Intervention modifiée - #" + intervention.getId(),
                            message
                    );
                    log.info("Email envoyé à {}", staff.getEmail());
                } catch (Exception e) {
                    log.error("Erreur envoi email à {}", staff.getEmail(), e);
                }
            }
        }
    }


    private void envoyerNotificationsModification(InterventionChirurgicale intervention) {
        // Recharger l'intervention avec l'équipe médicale
        InterventionChirurgicale freshIntervention = interventionRepository.findByIdWithMedicalTeam(intervention.getId())
                .orElseThrow(() -> {
                    logger.error("Intervention non trouvée: {}", intervention.getId());
                    return new RuntimeException("Intervention non trouvée");
                });

        if (freshIntervention.getEquipeMedicale().isEmpty()) {
            logger.warn("Aucune équipe médicale assignée à l'intervention {}", intervention.getId());
            return;
        }

        // Créer la notification de base
        NotificationDto notification = new NotificationDto();
        notification.setInterventionId(freshIntervention.getId().toString());
        notification.setType("INTERVENTION_MODIFIED");
        notification.setTitle("Intervention modifiée");
        notification.setMessage(buildNotificationMessage(freshIntervention));
        notification.setTimestamp(System.currentTimeMillis());

        // Envoyer à chaque membre de l'équipe
        freshIntervention.getEquipeMedicale().forEach(staff -> {
            notification.setUserId(staff.getId().toString());
            try {
                notificationClient.sendNotification(notification);
                logger.info("Notification envoyée à {} pour l'intervention {}", staff.getId(), freshIntervention.getId());
            } catch (Exception e) {
                logger.error("Échec d'envoi de notification à {}", staff.getId(), e);
            }
        });
    }
    private String buildNotificationMessage(InterventionChirurgicale intervention) {
        return String.format(
                "L'intervention #%d a été modifiée. Statut: %s, Date: %s, Salle: %s",
                intervention.getId(),
                intervention.getStatut(),
                intervention.getDate(),
                intervention.getRoomId()
        );
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


    @GetMapping("/check-conflict")
    public ResponseEntity<Map<String, Boolean>> checkInterventionConflict(
            @RequestParam Long roomId,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Long interventionId) {

        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);

        boolean hasConflict = interventionRepository.existsByRoomIdAndTimeRange(
                roomId,
                start,
                end,
                interventionId
        );

        return ResponseEntity.ok(Collections.singletonMap("hasConflict", hasConflict));
    }


    @GetMapping("/materiels/usage-counts")
    public ResponseEntity<Map<Long, Long>> getMaterielUsageCounts() {
        try {
            List<Object[]> results = interventionRepository.countAllMaterielsInNonCompletedInterventions();
            Map<Long, Long> counts = new HashMap<>();

            for (Object[] result : results) {
                Long materielId = (Long) result[0];
                Long count = (Long) result[1];
                counts.put(materielId, count);
            }

            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            log.error("Erreur lors du comptage des matériels utilisés", e);
            return ResponseEntity.internalServerError().build();
        }
    }


    @PostMapping("/with-room-and-user")
    public ResponseEntity<?> createInterventionWithRoomAndUser(
            @RequestBody InterventionRequest request,
            @RequestHeader("X-Current-User-ID") Long currentUserId) {
        try {
            // Vérification que le type d'intervention est présent
            if (request.getType() == null) {
                return ResponseEntity.badRequest().body("Le type d'intervention est obligatoire");
            }

            // Définir des valeurs par défaut si non fournies
            LocalDate defaultDate = LocalDate.now();
            LocalDateTime defaultStartTime = defaultDate.atTime(8, 0);
            LocalDateTime defaultEndTime = defaultDate.atTime(18, 0);

            LocalDateTime startTime = request.getStartTime() != null ?
                    request.getStartTime() :
                    (request.getDate() != null ? request.getDate().atStartOfDay() : defaultStartTime);

            LocalDateTime endTime = request.getEndTime() != null ?
                    request.getEndTime() :
                    (request.getDate() != null ? request.getDate().atTime(23, 59) : defaultEndTime);

            LocalDate date = request.getDate() != null ? request.getDate() : defaultDate;

            // Vérification disponibilité salle
            List<OperatingRoomDTO> availableRooms = roomManagementService.getAvailableRooms(
                    startTime,
                    endTime,
                    request.getType()
            );

            if (request.getRoomId() != null &&
                    availableRooms.stream().noneMatch(r -> r.getId().equals(request.getRoomId()))) {
                return ResponseEntity.badRequest().body("Salle non disponible");
            }

            // Création de l'intervention
            InterventionChirurgicale intervention = new InterventionChirurgicale();
            intervention.setDate(date);
            intervention.setStatut(request.getStatut() != null ?
                    request.getStatut() : StatutIntervention.PLANIFIEE);
            intervention.setType(request.getType());
            intervention.setRoomId(request.getRoomId());
            intervention.setStartTime(startTime);
            intervention.setEndTime(endTime);

            // Set the requesting doctor
            MedicalStaff doctor = medicalStaffRepository.findById(currentUserId)
                    .orElseThrow(() -> new RuntimeException("Doctor not found: " + currentUserId));
            intervention.setDoctor(doctor);

            // Assigner le patient si fourni
            if (request.getPatientId() != null) {
                Patient patient = patientRepository.findById(request.getPatientId())
                        .orElseThrow(() -> new RuntimeException("Patient non trouvé: " + request.getPatientId()));
                intervention.setPatient(patient);
            }

            // Sauvegarder l'intervention
            InterventionChirurgicale saved = interventionService.creerIntervention(intervention);

            // Assigner l'équipe médicale si fournie
            if (request.getEquipeMedicale() != null && !request.getEquipeMedicale().isEmpty()) {
                Map<RoleMedical, List<Long>> staffAssignments = new HashMap<>();
                request.getEquipeMedicale().forEach((roleStr, staffId) -> {
                    RoleMedical role = RoleMedical.valueOf(roleStr);
                    staffAssignments.put(role, Collections.singletonList(staffId));
                });
                interventionService.assignerStaffMultiple(saved.getId(), staffAssignments);
                saved = interventionService.getInterventionById(saved.getId())
                        .orElseThrow(() -> new RuntimeException("Intervention non trouvée après mise à jour"));
            }

            if (currentUserId != null) {
                sendAdminNotification(saved.getId(), currentUserId,
                        String.format("Nouvelle intervention de type %s programmée pour le %s",
                                saved.getType().name(), saved.getDate()));
            }

            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Erreur création intervention: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
    private ResponseEntity<?> createInterventionWithRoomInternal(
            InterventionRequest request, Long currentUserId) {
        try {
            // Définir des valeurs par défaut si non fournies
            LocalDate defaultDate = LocalDate.now();
            LocalDateTime defaultStartTime = defaultDate.atTime(8, 0);
            LocalDateTime defaultEndTime = defaultDate.atTime(18, 0);

            LocalDateTime startTime = request.getStartTime() != null ?
                    request.getStartTime() :
                    (request.getDate() != null ? request.getDate().atStartOfDay() : defaultStartTime);

            LocalDateTime endTime = request.getEndTime() != null ?
                    request.getEndTime() :
                    (request.getDate() != null ? request.getDate().atTime(23, 59) : defaultEndTime);

            LocalDate date = request.getDate() != null ? request.getDate() : defaultDate;

            // Vérification disponibilité salle
            List<OperatingRoomDTO> availableRooms = roomManagementService.getAvailableRooms(
                    startTime,
                    endTime,
                    request.getType()
            );

            if (request.getRoomId() != null &&
                    availableRooms.stream().noneMatch(r -> r.getId().equals(request.getRoomId()))) {
                return ResponseEntity.badRequest().body("Salle non disponible");
            }

            // Création de l'intervention
            InterventionChirurgicale intervention = new InterventionChirurgicale();
            intervention.setDate(date);
            intervention.setStatut(request.getStatut() != null ?
                    request.getStatut() :
                    StatutIntervention.PLANIFIEE);
            intervention.setType(request.getType());
            intervention.setRoomId(request.getRoomId());
            intervention.setStartTime(startTime);
            intervention.setEndTime(endTime);

            // Sauvegarder d'abord l'intervention
            InterventionChirurgicale saved = interventionService.creerIntervention(intervention);

            // Assigner l'équipe médicale si elle est fournie
            if (request.getEquipeMedicale() != null && !request.getEquipeMedicale().isEmpty()) {
                // Convertir la Map<String, Long> en Map<RoleMedical, Long>
                Map<RoleMedical, List<Long>> staffAssignments = new HashMap<>();
                request.getEquipeMedicale().forEach((roleStr, staffId) -> {
                    RoleMedical role = RoleMedical.valueOf(roleStr);
                    staffAssignments.put(role, Collections.singletonList(staffId));
                });

                // Assigner l'équipe
                interventionService.assignerStaffMultiple(saved.getId(), staffAssignments);

                // Recharger l'intervention avec l'équipe mise à jour
                saved = interventionService.getInterventionById(saved.getId())
                        .orElseThrow(() -> new RuntimeException("Intervention non trouvée après mise à jour"));
            }

            if (currentUserId != null) {
                sendAdminNotification(saved.getId(), currentUserId,
                        String.format("Nouvelle intervention de type %s programmée pour le %s",
                                saved.getType().name(), saved.getDate()));
            }

            return new ResponseEntity<>(saved, HttpStatus.CREATED);

        } catch (Exception e) {
            log.error("Erreur création intervention: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
    private void sendAdminNotification(Long interventionId, Long doctorId, String message) {
        try {
            String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8.toString());

            Map<String, Object> notificationRequest = new HashMap<>();
            notificationRequest.put("interventionId", interventionId);
            notificationRequest.put("doctorId", doctorId);
            notificationRequest.put("message", encodedMessage);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(notificationRequest, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    "http://notification-service/api/admin/notifications/intervention-request",
                    request,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Notification admin envoyée pour l'intervention {}", interventionId);
            } else {
                log.warn("Erreur notification admin. Statut: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Exception lors de l'envoi de notification admin", e);
        }


    }


    @GetMapping("/requests")
    public ResponseEntity<List<InterventionChirurgicale>> getInterventionRequests() {
        List<InterventionChirurgicale> requests = interventionService.findByStatut(StatutIntervention.DEMANDE);
        return ResponseEntity.ok(requests);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<InterventionChirurgicale> updateInterventionStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {

        StatutIntervention newStatus = StatutIntervention.valueOf(body.get("statut"));
        InterventionChirurgicale updated = interventionService.updateStatus(id, newStatus);
        return ResponseEntity.ok(updated);
    }


    // Nouveau endpoint pour la validation admin
    @PostMapping("/demandes/{id}/planifier")
    public ResponseEntity<?> planifierDemande(
            @PathVariable Long id,
            @RequestBody InterventionValidationDTO validationDTO) {

        try {
            // 1. Get intervention
            InterventionChirurgicale intervention = interventionRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention non trouvée"));

            // 2. Validate room availability
            if (validationDTO.getRoomId() != null) {
                boolean conflict = interventionRepository.existsByRoomIdAndTimeRange(
                        validationDTO.getRoomId(),
                        validationDTO.getStartTime(),
                        validationDTO.getEndTime(),
                        id);

                if (conflict) {
                    return ResponseEntity.badRequest().body("La salle n'est pas disponible");
                }
            }

            // 3. Update intervention
            intervention.setStatut(StatutIntervention.PLANIFIEE);
            if (validationDTO.getRoomId() != null) {
                intervention.setRoomId(validationDTO.getRoomId());
            }
            intervention.setStartTime(validationDTO.getStartTime());
            intervention.setEndTime(validationDTO.getEndTime());

            // 4. Save intervention first
            interventionRepository.save(intervention);

            // 5. Assign materials
            if (validationDTO.getMaterielIds() != null && !validationDTO.getMaterielIds().isEmpty()) {
                interventionService.assignerMateriel(id, validationDTO.getMaterielIds());
            }

            // 6. Assign staff - version robuste
            if (validationDTO.getEquipeMedicale() != null) {
                Map<RoleMedical, List<Long>> staffAssignments = new HashMap<>();

                validationDTO.getEquipeMedicale().forEach((roleStr, staffId) -> {
                    try {
                        RoleMedical role = RoleMedical.valueOf(roleStr.toUpperCase());
                        staffAssignments.put(role, Collections.singletonList(staffId));
                    } catch (IllegalArgumentException e) {
                        log.warn("Rôle invalide: {}", roleStr);
                    }
                });

                if (!staffAssignments.isEmpty()) {
                    interventionService.assignerStaffMultiple(id, staffAssignments);
                }
            }

            // 7. Return complete updated intervention
            InterventionChirurgicale updated = interventionRepository.findByIdWithDetails(id);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            log.error("Erreur planification intervention", e);
            return ResponseEntity.internalServerError().body("Erreur serveur");
        }
    }
    @GetMapping("/demandes/en-attente")
    public ResponseEntity<List<InterventionChirurgicale>> getDemandesEnAttente() {
        List<InterventionChirurgicale> demandes = interventionService.getDemandesEnAttente();
        return ResponseEntity.ok(demandes);
    }

    // Obtenir les demandes en attente de validation


    @GetMapping("/available-staff-by-specialite")
    public ResponseEntity<?> getAvailableStaffBySpecialite(
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam RoleMedical role,
            @RequestParam TypeIntervention interventionType) {

        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);

        List<MedicalStaff> availableStaff = interventionService.findAvailableStaffBySpecialite(start, end, role, interventionType);
        return ResponseEntity.ok(availableStaff);
    }







    @PutMapping("/demandes/{id}/valider-et-modifier")
    @Transactional
    public ResponseEntity<?> validerEtModifierDemande(
            @PathVariable Long id,
            @RequestBody InterventionValidationDTO validationDTO) {
        try {
            // 1. Récupérer l'intervention existante
            InterventionChirurgicale intervention = interventionRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention non trouvée"));

            // 2. Gestion de la date
            if (validationDTO.getDate() != null) {
                if (validationDTO.getDate().isBefore(LocalDate.now())) {
                    return ResponseEntity.badRequest().body("La date ne peut pas être dans le passé");
                }
                intervention.setDate(validationDTO.getDate());
                if (intervention.getStartTime() != null && validationDTO.getStartTime() == null) {
                    intervention.setStartTime(validationDTO.getDate().atTime(
                            intervention.getStartTime().toLocalTime()));
                }
                if (intervention.getEndTime() != null && validationDTO.getEndTime() == null) {
                    intervention.setEndTime(validationDTO.getDate().atTime(
                            intervention.getEndTime().toLocalTime()));
                }
            }

            // 3. Vérifier la disponibilité de la salle
            if (validationDTO.getRoomId() != null &&
                    !validationDTO.getRoomId().equals(intervention.getRoomId())) {
                LocalDateTime start = validationDTO.getStartTime() != null ?
                        validationDTO.getStartTime() : intervention.getStartTime();
                LocalDateTime end = validationDTO.getEndTime() != null ?
                        validationDTO.getEndTime() : intervention.getEndTime();

                boolean conflict = interventionRepository.existsByRoomIdAndTimeRange(
                        validationDTO.getRoomId(),
                        start,
                        end,
                        id);

                if (conflict) {
                    return ResponseEntity.badRequest().body("La salle n'est pas disponible pour cette plage horaire");
                }
            }

            // 4. Appliquer les modifications
            if (validationDTO.getType() != null) {
                intervention.setType(validationDTO.getType());
            }
            if (validationDTO.getRoomId() != null) {
                intervention.setRoomId(validationDTO.getRoomId());
            }
            if (validationDTO.getStartTime() != null) {
                intervention.setStartTime(validationDTO.getStartTime());
            }
            if (validationDTO.getEndTime() != null) {
                intervention.setEndTime(validationDTO.getEndTime());
            }
            if (validationDTO.getPatientId() != null) {
                Patient patient = patientRepository.findById(validationDTO.getPatientId())
                        .orElseThrow(() -> new RuntimeException("Patient non trouvé: " + validationDTO.getPatientId()));
                intervention.setPatient(patient);
            }
            intervention.setStatut(StatutIntervention.PLANIFIEE);

            // 5. Mettre à jour le matériel
            if (validationDTO.getMaterielIds() != null) {
                Set<Materiel> materiels = new HashSet<>(materielRepository.findAllById(validationDTO.getMaterielIds()));
                intervention.setMateriels(materiels);
            }

            // 6. Sauvegarder l'intervention
            InterventionChirurgicale updated = interventionRepository.save(intervention);

            // 7. Mettre à jour l'équipe médicale
            if (validationDTO.getEquipeMedicale() != null) {
                Map<RoleMedical, MedicalStaff> staffMap = new HashMap<>();
                validationDTO.getEquipeMedicale().forEach((roleStr, staffId) -> {
                    try {
                        RoleMedical role = RoleMedical.valueOf(roleStr);
                        MedicalStaff staff = medicalStaffRepository.findById(staffId)
                                .orElseThrow(() -> new RuntimeException("Staff non trouvé: " + staffId));
                        staffMap.put(role, staff);
                    } catch (IllegalArgumentException e) {
                        throw new RuntimeException("Rôle invalide: " + roleStr);
                    }
                });
                interventionService.updateEquipeMedicale(updated, staffMap);
            }

            // 8. Envoyer la notification de confirmation
            sendConfirmationNotification(updated);

            // 9. Retourner la réponse
            return ResponseEntity.ok(updated);

        } catch (RuntimeException e) {
            log.error("Erreur lors de la modification", e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Erreur lors de la modification", e);
            return ResponseEntity.internalServerError().body("Erreur serveur");
        }
    }

    // Nouvelle méthode pour envoyer la notification de confirmation
    private void sendConfirmationNotification(InterventionChirurgicale intervention) {
        try {
            MedicalStaff doctor = intervention.getDoctor();
            if (doctor == null || doctor.getRole() != RoleMedical.MEDECIN) {
                return;
            }

            // Créer un message détaillé
            String details = buildInterventionDetails(intervention);

            NotificationDto notificationDto = new NotificationDto();
            notificationDto.setUserId(doctor.getId().toString());
            notificationDto.setInterventionId(intervention.getId().toString());
            notificationDto.setType("INTERVENTION_CONFIRMED");
            notificationDto.setTitle("Intervention confirmée #" + intervention.getId());
            notificationDto.setMessage(details); // Message détaillé
            notificationDto.setTimestamp(System.currentTimeMillis());

            // Ajouter des données supplémentaires
            Map<String, Object> extraData = new HashMap<>();
            extraData.put("date", intervention.getDate().toString());
            extraData.put("room", intervention.getRoomId());
            extraData.put("type", intervention.getType().name());
            extraData.put("status", intervention.getStatut().name());
            notificationDto.setExtraData(new HashMap<>());
            notificationDto.getExtraData().put("date", intervention.getDate().toString());
            notificationDto.getExtraData().put("room", intervention.getRoomId());

            notificationClient.sendConfirmationNotification(notificationDto);
        } catch (Exception e) {
            log.error("Erreur notification confirmation", e);
        }
    }

    private String buildInterventionDetails(InterventionChirurgicale intervention) {
        StringBuilder sb = new StringBuilder();
        sb.append("Votre intervention #").append(intervention.getId()).append(" a été confirmée.\n\n");
        sb.append("Détails :\n");
        sb.append("- Date: ").append(intervention.getDate()).append("\n");
        sb.append("- Salle: ").append(intervention.getRoomId()).append("\n");
        sb.append("- Type: ").append(intervention.getType()).append("\n");
        sb.append("- Statut: ").append(intervention.getStatut()).append("\n");
        if (intervention.getPatient() != null) {
            sb.append("- Patient: ").append(intervention.getPatient().getNom())
                    .append(" ").append(intervention.getPatient().getPrenom()).append("\n");
        }
        sb.append("\n");

        if (intervention.getEquipeMedicale() != null && !intervention.getEquipeMedicale().isEmpty()) {
            sb.append("Équipe médicale:\n");
            intervention.getEquipeMedicale().forEach(staff -> {
                sb.append("- ").append(staff.getRole()).append(": ")
                        .append(staff.getNom()).append(" ").append(staff.getPrenom())
                        .append("\n");
            });
        }

        return sb.toString();
    }



    // Updated reminder logic for precise 24-hour notifications

    @Transactional
    @Scheduled(cron = "0 * * * * ?") // Run every minute
    public void checkAndSend24HourReminders() {
        checkRemindersWithTimeRange(false);
    }

    @GetMapping("/test-reminders")
    public ResponseEntity<Map<String, String>> testReminders(
            @RequestParam(defaultValue = "false") boolean bypassTimeCheck) {
        checkRemindersWithTimeRange(bypassTimeCheck);
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Reminder check triggered");
        return ResponseEntity.ok(response);
    }

    private void checkRemindersWithTimeRange(boolean bypassTimeCheck) {
        LocalDateTime now = LocalDateTime.now(ZoneId.of("Africa/Tunis")); // CET
        LocalDateTime start;
        LocalDateTime end;

        if (bypassTimeCheck) {
            // For testing: check interventions for the next day (00:00–23:59)
            start = now.plusDays(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            end = now.plusDays(1).withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else {
            // Check interventions exactly 24 hours from now (±30 seconds)
            start = now.plusHours(24).minusSeconds(30);
            end = now.plusHours(24).plusSeconds(30);
        }

        log.info("Checking interventions from {} to {}, bypassTimeCheck={}", start, end, bypassTimeCheck);

        List<InterventionChirurgicale> interventions = interventionRepository
                .findByStartTimeBetweenAndStatutWithEquipeMedicale(start, end, StatutIntervention.PLANIFIEE);
        log.info("Found {} interventions to process", interventions.size());

        interventions.forEach(this::send24HourReminderNotification);
    }

    private void send24HourReminderNotification(InterventionChirurgicale intervention) {
        if (intervention.getId() == null) {
            log.error("Invalid intervention: id=null");
            return;
        }
        if (intervention.getEquipeMedicale() == null || intervention.getEquipeMedicale().isEmpty()) {
            log.warn("No medical team assigned to interventionId={}", intervention.getId());
            return;
        }

        String message = String.format(
                "Rappel: Intervention prévue demain à %s. Type: %s, Salle: %s",
                intervention.getStartTime().toLocalTime(),
                intervention.getType(),
                intervention.getRoomId() != null ? intervention.getRoomId() : "Non attribuée"
        );

        intervention.getEquipeMedicale().forEach(staff -> {
            if (staff.getId() == null) {
                log.error("Invalid staff ID for interventionId={}", intervention.getId());
                return;
            }

            NotificationDto notification = new NotificationDto();
            String userId = staff.getId().toString();
            String interventionId = intervention.getId().toString();
            notification.setUserId(userId);
            notification.setInterventionId(interventionId);
            notification.setType("REMINDER_24H");
            notification.setTitle("Rappel d'intervention");
            notification.setMessage(message);
            notification.setTimestamp(System.currentTimeMillis());

            log.info("Sending notification: userId={} (type={}), interventionId={} (type={}), message={}",
                    userId, userId.getClass().getSimpleName(),
                    interventionId, interventionId.getClass().getSimpleName(),
                    message);

            try {
                notificationClient.sendNotification(notification);
                log.info("Notification sent successfully: userId={}, interventionId={}", userId, interventionId);
            } catch (Exception e) {
                log.error("Failed to send notification: userId={}, interventionId={}", userId, interventionId, e);
            }

            if (staff.getEmail() != null) {
                try {
                    emailService.sendEmail(
                            staff.getEmail(),
                            "Rappel intervention #" + interventionId,
                            message
                    );
                    log.info("Email sent to {}", staff.getEmail());
                } catch (Exception e) {
                    log.error("Failed to send email to {} for interventionId={}",
                            staff.getEmail(), interventionId, e);
                }
            }
        });
    }







    @PatchMapping("/{id}/annuler")
    public ResponseEntity<InterventionChirurgicale> annulerIntervention(@PathVariable Long id) {
        logger.info("Received PATCH request to cancel intervention ID: {}", id);
        try {
            InterventionChirurgicale cancelledIntervention = interventionService.annulerIntervention(id);
            logger.info("Intervention ID: {} cancelled successfully, new status: {}", id, cancelledIntervention.getStatut());
            return ResponseEntity.ok(cancelledIntervention);
        } catch (ResponseStatusException e) {
            logger.error("Error cancelling intervention ID: {} - {}", id, e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error cancelling intervention ID: {}", id, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur lors de l'annulation de l'intervention", e);
        }
    }









    @GetMapping("/check-full-conflict")
    public ResponseEntity<Map<String, Boolean>> checkFullConflict(
            @RequestParam Long roomId,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Long interventionId) {

        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);

        // Vérifier conflits dans les interventions
        boolean interventionConflict = interventionRepository.existsByRoomIdAndTimeRange(
                roomId, start, end, interventionId);

        // Vérifier conflits dans les réservations
        ResponseEntity<Map<String, Boolean>> reservationConflictResponse;
        try {
            reservationConflictResponse = restTemplate.exchange(
                    "http://user-service/api/reservations/check-conflict?roomName={roomName}&startTime={startTime}&endTime={endTime}",
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<Map<String, Boolean>>() {},
                    roomId.toString(),
                    startTime,
                    endTime
            );
        } catch (Exception e) {
            log.error("Erreur vérification réservation", e);
            return ResponseEntity.internalServerError().body(Collections.singletonMap("error", true));
        }

        boolean hasConflict = interventionConflict ||
                Boolean.TRUE.equals(reservationConflictResponse.getBody().get("hasConflict"));

        return ResponseEntity.ok(Collections.singletonMap("hasConflict", hasConflict));
    }




    @GetMapping("/stats/by-status")
    public ResponseEntity<Map<StatutIntervention, Long>> getInterventionsCountByStatus() {
        try {
            Map<StatutIntervention, Long> counts = interventionRepository.findAll().stream()
                    .collect(Collectors.groupingBy(
                            InterventionChirurgicale::getStatut,
                            Collectors.counting()
                    ));
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des stats par statut", e);
            return ResponseEntity.internalServerError().build();
        }
    }



    @GetMapping("/stats/by-type")
    public ResponseEntity<Map<TypeIntervention, Long>> getInterventionsCountByType() {
        try {
            Map<TypeIntervention, Long> counts = interventionRepository.findAll().stream()
                    .collect(Collectors.groupingBy(
                            InterventionChirurgicale::getType,
                            Collectors.counting()
                    ));
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des stats par type", e);
            return ResponseEntity.internalServerError().build();
        }
    }


    @GetMapping("/stats/daily")
    public ResponseEntity<Map<String, Long>> getInterventionsCountByDay(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<InterventionChirurgicale> interventions = interventionService.getInterventionsEntreDates(start, end);
            Map<String, Long> counts = interventions.stream()
                    .collect(Collectors.groupingBy(
                            i -> i.getDate().toString(),
                            Collectors.counting()
                    ));
            return ResponseEntity.ok(counts);
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des stats quotidiennes", e);
            return ResponseEntity.internalServerError().build();
        }
    }



    @DeleteMapping("/{id}/reject")
    @Transactional
    public ResponseEntity<Void> rejectAndDeleteIntervention(@PathVariable Long id) {
        interventionRepository.deleteById(id); // Suppression pure
        return ResponseEntity.noContent().build();
    }





    @PatchMapping("/{id}/assign-patient")
    public ResponseEntity<?> assignPatientToIntervention(
            @PathVariable Long id,
            @RequestBody Map<String, Long> body) {
        try {
            Long patientId = body.get("patientId");
            if (patientId == null) {
                return ResponseEntity.badRequest().body("L'ID du patient est requis");
            }

            // Vérifier que l'intervention existe
            InterventionChirurgicale intervention = interventionRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Intervention non trouvée"));

            // Vérifier que le patient existe
            Patient patient = patientRepository.findById(patientId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient non trouvé"));

            // Assigner le patient à l'intervention
            intervention.setPatient(patient);

            // Sauvegarder l'intervention mise à jour
            InterventionChirurgicale updated = interventionRepository.save(intervention);

            logger.info("Patient {} assigné à l'intervention {}", patientId, id);
            return ResponseEntity.ok(updated);

        } catch (ResponseStatusException e) {
            logger.error("Erreur lors de l'assignation du patient: {}", e.getMessage());
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (Exception e) {
            logger.error("Erreur serveur lors de l'assignation du patient: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Erreur serveur: " + e.getMessage());
        }
    }


}



