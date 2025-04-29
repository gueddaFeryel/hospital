package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.Service.MedicalStaffService;
import com.example.dashboard_service.model.MedicalStaff;
import com.example.dashboard_service.model.RoleMedical;
import com.example.dashboard_service.model.dto.MedicalStaffSyncDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.time.Instant;
import java.util.Arrays;
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
            @RequestBody MedicalStaff staffDetails) {

        return medicalStaffRepository.findById(id)
                .map(staff -> {
                    staff.setNom(staffDetails.getNom());
                    staff.setPrenom(staffDetails.getPrenom());
                    staff.setRole(staffDetails.getRole());
                    return ResponseEntity.ok(medicalStaffRepository.save(staff));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    // Modifiez la méthode syncMedicalStaff
    @PostMapping("/sync")
    public ResponseEntity<?> syncMedicalStaff(@RequestBody @Valid MedicalStaffSyncDto dto) {
        try {
            // Validation supplémentaire
            if (dto.getFirebase_uid() == null || dto.getFirebase_uid().trim().isEmpty()) {
                throw new IllegalArgumentException("Firebase UID ne peut pas être vide");
            }

            MedicalStaff staff = medicalStaffRepository.findByFirebaseUid(dto.getFirebase_uid())
                    .orElseGet(() -> {
                        MedicalStaff newStaff = new MedicalStaff();
                        newStaff.setFirebaseUid(dto.getFirebase_uid());
                        return newStaff;
                    });

            staff.setEmail(dto.getEmail());
            staff.setNom(dto.getNom());
            staff.setPrenom(dto.getPrenom());
            staff.setRole(RoleMedical.valueOf(dto.getRole()));

            return ResponseEntity.ok(medicalStaffRepository.save(staff));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "error", "VALIDATION_ERROR",
                            "message", e.getMessage(),
                            "timestamp", Instant.now()
                    ));
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

}
