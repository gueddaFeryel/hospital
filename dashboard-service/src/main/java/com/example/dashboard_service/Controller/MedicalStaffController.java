package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.Service.MedicalStaffService;
import com.example.dashboard_service.model.MedicalStaff;
import com.example.dashboard_service.model.RoleMedical;
import com.example.dashboard_service.model.dto.MedicalStaffSyncDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medical-staff")
@CrossOrigin(origins = "http://localhost:3000")
public class MedicalStaffController {

    @Autowired
    private MedicalStaffRepository medicalStaffRepository;
    @Autowired
    private MedicalStaffService medicalStaffService;
    private static final Logger logger = LoggerFactory.getLogger(MedicalStaffController.class);
    @PostMapping
    public ResponseEntity<MedicalStaff> createMedicalStaff(@RequestBody MedicalStaff medicalStaff) {
        try {
            MedicalStaff savedStaff = medicalStaffRepository.save(medicalStaff);
            return new ResponseEntity<>(savedStaff, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<MedicalStaff>> getAllMedicalStaff() {
        return ResponseEntity.ok(medicalStaffRepository.findAll());
    }
    // In MedicalStaffController.java
    @GetMapping("/by-firebase/{firebaseUid}")
    public ResponseEntity<MedicalStaff> getMedicalStaffByFirebaseUid(@PathVariable String firebaseUid) {
        return medicalStaffRepository.findByFirebaseUid(firebaseUid)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/{id}")
    public ResponseEntity<MedicalStaff> getMedicalStaffById(@PathVariable Long id) {
        return medicalStaffRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/by-role/{role}")
    public ResponseEntity<List<MedicalStaff>> getMedicalStaffByRole(@PathVariable RoleMedical role) {
        return ResponseEntity.ok(medicalStaffRepository.findByRole(role));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MedicalStaff> updateMedicalStaff(
            @PathVariable Long id,
            @RequestBody @Valid MedicalStaffSyncDto staffDetails) {
        try {
            return medicalStaffRepository.findById(id)
                    .map(staff -> {
                        // Update basic fields
                        staff.setNom(staffDetails.getNom());
                        staff.setPrenom(staffDetails.getPrenom());
                        staff.setEmail(staffDetails.getEmail());

                        // Validate and set role
                        RoleMedical role = RoleMedical.valueOf(staffDetails.getRole());
                        staff.setRole(role);

                        // Handle specialties based on role
                        if (role == RoleMedical.MEDECIN) {
                            if (staffDetails.getSpecialiteMedecin() == null) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Spécialité médecin requise pour le rôle MEDECIN");
                            }
                            staff.setSpecialiteMedecin(staffDetails.getSpecialiteMedecinAsEnum());
                            staff.setSpecialiteAnesthesiste(null); // Clear other specialty
                        } else if (role == RoleMedical.ANESTHESISTE) {
                            if (staffDetails.getSpecialiteAnesthesiste() == null) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Spécialité anesthésiste requise pour le rôle ANESTHESISTE");
                            }
                            staff.setSpecialiteAnesthesiste(staffDetails.getSpecialiteAnesthesisteAsEnum());
                            staff.setSpecialiteMedecin(null); // Clear other specialty
                        } else {
                            staff.setSpecialiteMedecin(null);
                            staff.setSpecialiteAnesthesiste(null);
                        }

                        // Update image
                        if (staffDetails.getImage() != null) {
                            if (staffDetails.getImage().length() > 10 * 1024 * 1024) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image trop grande (max 7MB)");
                            }
                            if (!staffDetails.getImage().matches("^data:image/(jpeg|png|gif);base64,.+")) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format d’image invalide");
                            }
                            staff.setImage(staffDetails.getImage());
                        }

                        MedicalStaff updatedStaff = medicalStaffRepository.save(staff);
                        logger.info("Staff updated: id={}, role={}, specialiteMedecin={}, specialiteAnesthesiste={}",
                                updatedStaff.getId(), updatedStaff.getRole(), updatedStaff.getSpecialiteMedecin(), updatedStaff.getSpecialiteAnesthesiste());
                        return ResponseEntity.ok(updatedStaff);
                    })
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));
        } catch (IllegalArgumentException e) {
            logger.error("Invalid input: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            logger.error("Server error: ", e);
            return ResponseEntity.internalServerError().body(null);
        }
    }
    // Modifiez la méthode syncMedicalStaff
    @PostMapping("/sync")
    public ResponseEntity<?> syncMedicalStaff(@RequestBody @Valid MedicalStaffSyncDto dto) {
        try {
            MedicalStaff staff = medicalStaffRepository.findByFirebaseUid(dto.getFirebase_uid())
                    .orElseGet(() -> {
                        MedicalStaff newStaff = new MedicalStaff();
                        newStaff.setFirebaseUid(dto.getFirebase_uid());
                        return newStaff;
                    });

            // Mise à jour des champs de base
            staff.setEmail(dto.getEmail());
            staff.setNom(dto.getNom());
            staff.setPrenom(dto.getPrenom());

            // Conversion et validation du rôle
            RoleMedical role = RoleMedical.valueOf(dto.getRole());
            staff.setRole(role);

            // Gestion des spécialités
            if (role == RoleMedical.MEDECIN) {
                if (dto.getSpecialiteMedecin() != null) {
                    staff.setSpecialiteMedecin(dto.getSpecialiteMedecinAsEnum());
                }
                staff.setSpecialiteAnesthesiste(null); // Nettoyage si changement de rôle
            }
            else if (role == RoleMedical.ANESTHESISTE) {
                if (dto.getSpecialiteAnesthesiste() != null) {
                    staff.setSpecialiteAnesthesiste(dto.getSpecialiteAnesthesisteAsEnum());
                }
                staff.setSpecialiteMedecin(null); // Nettoyage si changement de rôle
            }
            else {
                // Pour les autres rôles (INFIRMIER), on nettoie les spécialités
                staff.setSpecialiteMedecin(null);
                staff.setSpecialiteAnesthesiste(null);
            }

            MedicalStaff savedStaff = medicalStaffRepository.save(staff);
            return ResponseEntity.ok(savedStaff);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Données invalides: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur serveur: " + e.getMessage());
        }
    }
    @PutMapping("/update-by-firebase/{firebaseUid}")
    public ResponseEntity<?> updateByFirebaseUid(
            @PathVariable String firebaseUid,
            @RequestBody Map<String, String> updates) {

        try {
            MedicalStaff staff = (MedicalStaff) medicalStaffRepository.findByFirebaseUid(firebaseUid)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Staff not found"));

            if (updates.containsKey("role")) {
                staff.setRole(RoleMedical.valueOf(updates.get("role").toUpperCase()));
            }

            MedicalStaff updatedStaff = medicalStaffRepository.save(staff);
            return ResponseEntity.ok(updatedStaff);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Rôle invalide: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur serveur: " + e.getMessage());
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMedicalStaff(@PathVariable Long id) {
        try {
            // Vérifiez d'abord si le membre existe
            if (!medicalStaffRepository.existsById(id)) {
                return ResponseEntity.notFound().build();
            }

            medicalStaffRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "error", "DELETE_ERROR",
                            "message", "Erreur lors de la suppression: " + e.getMessage(),
                            "timestamp", Instant.now()
                    ));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createMedicalStaff(@RequestBody @Valid MedicalStaffSyncDto dto) {
        try {
            logger.info("Tentative de création - Taille image: {}",
                    dto.getImage() != null ? dto.getImage().length() : "null");

            // Validation améliorée de l'image
            if (dto.getImage() != null) {
                // 10MB max en Base64 (~7MB fichier)
                if (dto.getImage().length() > 10 * 1024 * 1024) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "IMAGE_TOO_LARGE", "message", "Max 7MB"));
                }

                if (!dto.getImage().matches("^data:image/(jpeg|png|gif);base64,.+")) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "INVALID_IMAGE", "message", "Format invalide"));
                }
            }
            // 3. Vérification email
            if (medicalStaffRepository.findByEmail(dto.getEmail()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("error", "EMAIL_EXISTS"));
            }

            // 4. Conversion rôle
            RoleMedical role;
            try {
                role = RoleMedical.valueOf(dto.getRole());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "INVALID_ROLE"));
            }

            // 5. Création du staff
            MedicalStaff staff = new MedicalStaff();
            staff.setEmail(dto.getEmail());
            staff.setNom(dto.getNom());
            staff.setPrenom(dto.getPrenom());
            staff.setRole(role);
            staff.setImage(dto.getImage());

            // 6. Gestion spécialités
            if (role == RoleMedical.MEDECIN) {
                staff.setSpecialiteMedecin(dto.getSpecialiteMedecinAsEnum());
            } else if (role == RoleMedical.ANESTHESISTE) {
                staff.setSpecialiteAnesthesiste(dto.getSpecialiteAnesthesisteAsEnum());
            }

            MedicalStaff savedStaff = medicalStaffRepository.save(staff);
            return ResponseEntity.ok(savedStaff);

        } catch (Exception e) {
            logger.error("Erreur création staff", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "SERVER_ERROR", "message", e.getMessage()));
        }
    }
    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Fichier vide");
            }

            if (file.getSize() > 500 * 1024) {
                return ResponseEntity.badRequest().body("Max 500KB");
            }

            String base64 = "data:" + file.getContentType() + ";base64," +
                    Base64.getEncoder().encodeToString(file.getBytes());

            return ResponseEntity.ok(base64);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erreur de traitement");
        }
    }


    @PostMapping(value = "/create-with-image")
    public ResponseEntity<?> createMedicalStaffWithImage(@RequestBody @Valid MedicalStaffSyncDto dto) {
        try {
            logger.info("Received DTO: firebase_uid={}, email={}, nom={}, prenom={}, role={}, specialiteMedecin={}, specialiteAnesthesiste={}",
                    dto.getFirebase_uid(), dto.getEmail(), dto.getNom(), dto.getPrenom(), dto.getRole(),
                    dto.getSpecialiteMedecin(), dto.getSpecialiteAnesthesiste());

            // Validation du rôle
            RoleMedical role;
            try {
                role = RoleMedical.valueOf(dto.getRole());
            } catch (IllegalArgumentException e) {
                logger.error("Invalid role: {}", dto.getRole(), e);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "INVALID_ROLE",
                                "message", "Rôle valide: MEDECIN, ANESTHESISTE, INFIRMIER, GESTIONNAIRE_ADMIN"));
            }

            // Création du staff
            MedicalStaff staff = new MedicalStaff();
            staff.setEmail(dto.getEmail());
            staff.setNom(dto.getNom());
            staff.setPrenom(dto.getPrenom());
            staff.setRole(role);
            staff.setImage(dto.getImage());
            staff.setFirebaseUid(dto.getFirebase_uid());

            // Gestion des spécialités
            if (role == RoleMedical.MEDECIN) {
                if (dto.getSpecialiteMedecin() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "MISSING_SPECIALITE_MEDECIN", "message", "Spécialité médecin requise"));
                }
                try {
                    staff.setSpecialiteMedecin(dto.getSpecialiteMedecinAsEnum());
                    logger.info("Set specialiteMedecin: {}", staff.getSpecialiteMedecin());
                } catch (IllegalArgumentException e) {
                    logger.error("Invalid specialiteMedecin: {}", dto.getSpecialiteMedecin(), e);
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "INVALID_SPECIALITE_MEDECIN", "message", "Spécialité médecin invalide: " + dto.getSpecialiteMedecin()));
                }
                staff.setSpecialiteAnesthesiste(null); // Clear other specialty
            } else if (role == RoleMedical.ANESTHESISTE) {
                if (dto.getSpecialiteAnesthesiste() == null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "MISSING_SPECIALITE_ANESTHESISTE", "message", "Spécialité anesthésiste requise"));
                }
                try {
                    staff.setSpecialiteAnesthesiste(dto.getSpecialiteAnesthesisteAsEnum());
                    logger.info("Set specialiteAnesthesiste: {}", staff.getSpecialiteAnesthesiste());
                } catch (IllegalArgumentException e) {
                    logger.error("Invalid specialiteAnesthesiste: {}", dto.getSpecialiteAnesthesiste(), e);
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "INVALID_SPECIALITE_ANESTHESISTE", "message", "Spécialité anesthésiste invalide: " + dto.getSpecialiteAnesthesiste()));
                }
                staff.setSpecialiteMedecin(null); // Clear other specialty
            } else {
                staff.setSpecialiteMedecin(null);
                staff.setSpecialiteAnesthesiste(null);
            }

            // Enregistrement
            MedicalStaff savedStaff = medicalStaffRepository.save(staff);
            logger.info("Saved staff: id={}, specialiteMedecin={}, specialiteAnesthesiste={}",
                    savedStaff.getId(), savedStaff.getSpecialiteMedecin(), savedStaff.getSpecialiteAnesthesiste());

            return ResponseEntity.ok(Map.of(
                    "id", savedStaff.getId(),
                    "role", savedStaff.getRole().name(),
                    "isAdmin", role == RoleMedical.GESTIONNAIRE_ADMIN
            ));

        } catch (DataIntegrityViolationException e) {
            logger.error("Erreur DB: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "DB_ERROR", "message", "Violation contrainte base de données"));
        } catch (Exception e) {
            logger.error("Erreur serveur: ", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "SERVER_ERROR", "message", e.toString()));
        }
    }
}
