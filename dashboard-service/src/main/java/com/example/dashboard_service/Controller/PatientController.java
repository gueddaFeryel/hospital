package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Service.PatientService;
import com.example.dashboard_service.model.Patient;
import com.example.dashboard_service.model.dto.PatientDTO;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/patients")
public class PatientController {
    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @PostMapping
    public ResponseEntity<Patient> creerPatient(@RequestBody Patient patient) {
        return ResponseEntity.ok(patientService.creerPatient(patient));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Patient> getPatient(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getPatient(id));
    }

    @GetMapping
    public ResponseEntity<Page<PatientDTO>> getAllPatients(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (search != null && !search.isEmpty()) {
            return ResponseEntity.ok(patientService.searchPatients(search, page, size));
        }
        return ResponseEntity.ok(patientService.getAllPatients(page, size));
    }
    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(
            @PathVariable Long id,
            @RequestBody Patient patient) {
        // Ensure the ID in the path matches the patient object
        if (!id.equals(patient.getId())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(patientService.updatePatient(patient));
    }

}
