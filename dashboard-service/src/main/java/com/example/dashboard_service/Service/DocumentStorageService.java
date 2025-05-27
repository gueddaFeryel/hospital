package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.DocumentRepository;
import com.example.dashboard_service.Repository.PatientRepository;
import com.example.dashboard_service.model.Document;
import com.example.dashboard_service.model.Patient;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class DocumentStorageService {
    private final DocumentRepository documentRepository;
    private final PatientRepository patientRepository;

    public DocumentStorageService(DocumentRepository documentRepository,
                                  PatientRepository patientRepository) {
        this.documentRepository = documentRepository;
        this.patientRepository = patientRepository;
    }

    public Document stockerDocument(Long patientId, MultipartFile file) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        validerFichierPdf(file); // Validate the file before processing

        try {
            Document document = new Document();
            document.setNomFichier(normaliserNomFichier(file.getOriginalFilename()));
            document.setTypeMime(determinerTypeMime(file));
            document.setTaille(file.getSize());
            document.setDonnees(file.getBytes());
            document.setPatient(patient);

            return documentRepository.save(document);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier", e);
        }
    }

    public List<Document> stockerDocuments(Long patientId, MultipartFile[] files) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient non trouvé"));

        return Arrays.stream(files)
                .peek(this::validerFichierPdf)
                .map(file -> convertirEnDocument(file, patient))
                .map(documentRepository::save)
                .collect(Collectors.toList());
    }

    private void validerFichierPdf(MultipartFile file) {
        String contentType = determinerTypeMime(file);
        if (!"application/pdf".equals(contentType)) {
            throw new RuntimeException("Seuls les fichiers PDF sont acceptés");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".pdf")) {
            throw new RuntimeException("L'extension du fichier doit être .pdf");
        }
        if (file.getSize() > 10_000_000) {
            throw new RuntimeException("Le fichier est trop volumineux (max 10MB)");
        }
    }

    private Document convertirEnDocument(MultipartFile file, Patient patient) {
        try {
            Document doc = new Document();
            doc.setNomFichier(normaliserNomFichier(file.getOriginalFilename()));
            doc.setTypeMime(determinerTypeMime(file));
            doc.setTaille(file.getSize());
            doc.setDonnees(file.getBytes());
            doc.setPatient(patient);
            return doc;
        } catch (IOException e) {
            throw new RuntimeException("Erreur de lecture du fichier", e);
        }
    }

    private String normaliserNomFichier(String nomFichier) {
        if (nomFichier == null) {
            return "document_" + System.currentTimeMillis() + ".pdf";
        }
        // Remove special characters, replace spaces with underscores, and ensure lowercase
        String normalized = nomFichier.replaceAll("[^a-zA-Z0-9._-]", "")
                .replaceAll("\\s+", "_")
                .toLowerCase();
        // Ensure the file ends with .pdf
        if (!normalized.endsWith(".pdf")) {
            normalized = normalized + ".pdf";
        }
        return normalized;
    }

    private String determinerTypeMime(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || contentType.isEmpty()) {
            // Fallback to checking the file extension
            String filename = file.getOriginalFilename();
            if (filename != null && filename.toLowerCase().endsWith(".pdf")) {
                return "application/pdf";
            }
            throw new RuntimeException("Type MIME non détecté et extension invalide");
        }
        return contentType;
    }





    public Document modifierDocument(Long documentId, MultipartFile file) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));

        validerFichierPdf(file);

        try {
            document.setNomFichier(normaliserNomFichier(file.getOriginalFilename()));
            document.setTypeMime(determinerTypeMime(file));
            document.setTaille(file.getSize());
            document.setDonnees(file.getBytes());
            return documentRepository.save(document);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la lecture du fichier", e);
        }
    }

    public void supprimerDocument(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));
        documentRepository.delete(document);
    }
}
