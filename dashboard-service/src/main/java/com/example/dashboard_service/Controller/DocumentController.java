package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Repository.DocumentRepository;
import com.example.dashboard_service.Service.DocumentStorageService;

import com.example.dashboard_service.model.Document;
import com.example.dashboard_service.model.dto.DocumentDTO;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/patients/{patientId}/documents")
public class DocumentController {
    private static final Logger LOGGER = Logger.getLogger(DocumentController.class.getName());
    private final DocumentStorageService documentStorageService;
    private final DocumentRepository documentRepository;

    public DocumentController(DocumentStorageService documentStorageService, DocumentRepository documentRepository) {
        this.documentStorageService = documentStorageService;
        this.documentRepository = documentRepository;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> uploadDocuments(
            @PathVariable Long patientId,
            @RequestPart("files") MultipartFile[] files) {
        try {
            List<Document> savedDocuments = documentStorageService.stockerDocuments(patientId, files);
            return new ResponseEntity<>(savedDocuments, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<DocumentDTO>> getDocuments(@PathVariable Long patientId) {
        List<Document> documents = documentRepository.findByPatientId(patientId);
        List<DocumentDTO> documentDTOs = documents.stream()
                .map(doc -> new DocumentDTO(doc.getId(), doc.getNomFichier(), doc.getTypeMime(), doc.getTaille(), doc.getDateCreation()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(documentDTOs);
    }


    // New endpoint to download PDF
    @GetMapping("/{documentId}/download")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long patientId,
            @PathVariable Long documentId) {
        try {
            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new RuntimeException("Document non trouvé: ID " + documentId));
            if (!document.getPatient().getId().equals(patientId)) {
                LOGGER.warning("Document ID " + documentId + " does not belong to patient ID " + patientId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            if (document.getDonnees() == null || document.getDonnees().length == 0) {
                LOGGER.warning("Document ID " + documentId + " has no data");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(null);
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("inline", document.getNomFichier());
            headers.setContentLength(document.getDonnees().length);
            LOGGER.info("Serving PDF for document ID " + documentId + ", size: " + document.getDonnees().length);
            return new ResponseEntity<>(document.getDonnees(), headers, HttpStatus.OK);
        } catch (Exception e) {
            LOGGER.severe("Error downloading document ID " + documentId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }





    }

    @PutMapping("/{documentId}")
    public ResponseEntity<?> modifierDocument(
            @PathVariable Long patientId,
            @PathVariable Long documentId,
            @RequestPart("file") MultipartFile file) {
        try {
            Document updatedDocument = documentStorageService.modifierDocument(documentId, file);
            return ResponseEntity.ok(updatedDocument);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> supprimerDocument(
            @PathVariable Long patientId,
            @PathVariable Long documentId) {
        documentStorageService.supprimerDocument(documentId);
        return ResponseEntity.noContent().build();
    }
}
