package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Service.MaterielService;
import com.example.dashboard_service.model.CategorieMateriel;
import com.example.dashboard_service.model.ErrorResponse;
import com.example.dashboard_service.model.Materiel;
import com.example.dashboard_service.model.dto.MaterielDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/materiels")
@CrossOrigin(origins = "http://localhost:3000")
public class MaterielController {

    @Autowired
    private MaterielService materielService;
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createMateriel(@Valid @RequestBody MaterielDto materielDto) {
        try {
            // Validation de la quantité
            if (materielDto.getQuantiteDisponible() <= 0) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("QUANTITY_INVALID", "La quantité doit être positive"));
            }

            // Plus besoin de conversion, l'enum est déjà dans le bon format
            Materiel materiel = new Materiel();
            materiel.setNom(materielDto.getNom());
            materiel.setDescription(materielDto.getDescription());
            materiel.setQuantiteDisponible(materielDto.getQuantiteDisponible());
            materiel.setCategorie(materielDto.getCategorie());

            Materiel savedMateriel = materielService.createMateriel(materiel);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedMateriel);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorResponse("SERVER_ERROR", e.getMessage()));
        }
    }
    @GetMapping
    public List<Materiel> getAllMateriels() {
        return materielService.getAllMateriels();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Materiel> getMaterielById(@PathVariable Long id) {
        return materielService.getMaterielById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/categorie/{categorie}")
    public List<Materiel> getMaterielsByCategorie(@PathVariable CategorieMateriel categorie) {
        return materielService.getMaterielsByCategorie(categorie);
    }

    @GetMapping("/search")
    public List<Materiel> searchMateriels(@RequestParam String nom) {
        return materielService.searchMateriels(nom);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateMateriel(
            @PathVariable Long id,
            @Valid @RequestBody MaterielDto materielDto) {  // Utilisez le DTO comme pour le POST

        try {
            // Validation
            if (materielDto.getQuantiteDisponible() <= 0) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("INVALID_QUANTITY", "La quantité doit être positive"));
            }

            // Conversion DTO -> Entity
            Materiel materiel = new Materiel();
            materiel.setId(id);
            materiel.setNom(materielDto.getNom());
            materiel.setDescription(materielDto.getDescription());
            materiel.setQuantiteDisponible(materielDto.getQuantiteDisponible());
            materiel.setCategorie(materielDto.getCategorie());

            Materiel updated = materielService.updateMateriel(id, materiel);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ErrorResponse("UPDATE_FAILED", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMateriel(@PathVariable Long id) {
        materielService.deleteMateriel(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/available")
    public ResponseEntity<List<Materiel>> getAvailableMaterials(
            @RequestParam(required = false) Long interventionId) {

        try {
            List<Materiel> materials;

            if (interventionId != null) {
                // Récupère les matériels disponibles pour une intervention spécifique
                materials = materielService.getAvailableMaterialsForIntervention(interventionId);
            } else {
                // Récupère tous les matériels disponibles
                materials = materielService.getAvailableMaterials();
            }

            return ResponseEntity.ok(materials);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }





    @PatchMapping("/{id}/ajuster-stock")
    public ResponseEntity<?> ajusterStock(
            @PathVariable Long id,
            @RequestParam int quantite,
            @RequestParam boolean augmentation) { // true=+, false=-

        return materielService.ajusterStock(id, quantite, augmentation);
    }

}
