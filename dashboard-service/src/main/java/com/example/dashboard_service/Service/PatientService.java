package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.PatientRepository;
import com.example.dashboard_service.model.Patient;
import com.example.dashboard_service.model.dto.PatientDTO;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PatientService {
    private final PatientRepository patientRepository;

    public PatientService(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    public Patient creerPatient(Patient patient) {
        return patientRepository.save(patient);
    }

    public Patient getPatient(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
    }
    public Patient modifierPatient(Long id, Patient patientDetails) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        patient.setNom(patientDetails.getNom());
        patient.setPrenom(patientDetails.getPrenom());
        patient.setDateNaissance(patientDetails.getDateNaissance());
        patient.setTelephone(patientDetails.getTelephone());
        patient.setAdresse(patientDetails.getAdresse());

        return patientRepository.save(patient);
    }

    public void supprimerPatient(Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));
        patientRepository.delete(patient);
    }
    public Patient updatePatient(Patient patient) {
        // Check if the patient exists
        if (!patientRepository.existsById(patient.getId())) {
            throw new RuntimeException("Patient not found: ID " + patient.getId());
        }
        return patientRepository.save(patient);
    }
    // Mettre à jour les méthodes de mapping pour inclure les nouveaux champs
    public Page<PatientDTO> getAllPatients(int page, int size) {
        Page<Patient> patientPage = patientRepository.findAll(PageRequest.of(page, size));
        List<PatientDTO> patientDTOs = patientPage.getContent().stream()
                .map(p -> new PatientDTO(p.getId(), p.getNom(), p.getPrenom(),
                        p.getDateNaissance(), p.getTelephone(), p.getAdresse()))
                .collect(Collectors.toList());
        return new PageImpl<>(patientDTOs, patientPage.getPageable(), patientPage.getTotalElements());
    }

    public Page<PatientDTO> searchPatients(String searchTerm, int page, int size) {
        Page<Patient> patientPage = patientRepository.findByNomContainingIgnoreCaseOrPrenomContainingIgnoreCase(
                searchTerm, PageRequest.of(page, size));
        List<PatientDTO> patientDTOs = patientPage.getContent().stream()
                .map(p -> new PatientDTO(p.getId(), p.getNom(), p.getPrenom(),
                        p.getDateNaissance(), p.getTelephone(), p.getAdresse()))
                .collect(Collectors.toList());
        return new PageImpl<>(patientDTOs, patientPage.getPageable(), patientPage.getTotalElements());
    }





}
