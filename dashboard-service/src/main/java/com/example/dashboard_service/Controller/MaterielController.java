package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Service.MaterielService;
import com.example.dashboard_service.model.CategorieMateriel;
import com.example.dashboard_service.model.Materiel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/materiels")
@CrossOrigin(origins = "http://localhost:3000")
public class MaterielController {

    @Autowired
    private MaterielService materielService;

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createMateriel(@RequestBody Map<String, Object> requestMap) {
        try {
            Materiel materiel = new Materiel();
            materiel.setNom((String) requestMap.get("nom"));
            materiel.setDescription((String) requestMap.get("description"));
            materiel.setQuantiteDisponible(Integer.parseInt(requestMap.get("quantiteDisponible").toString()));
            materiel.setCategorie(CategorieMateriel.valueOf((String) requestMap.get("categorie")));

            // Validation manuelle
            if (materiel.getNom() == null || materiel.getNom().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Le nom est obligatoire");
            }

            Materiel saved = materielService.createMateriel(materiel);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
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

    @PutMapping(value = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateMateriel(
            @PathVariable Long id,
            @RequestBody Map<String, Object> requestMap) {

        try {
            // Récupération du matériel existant
            Materiel existingMateriel = materielService.getMaterielById(id)
                    .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));

            // Mise à jour des champs
            if (requestMap.containsKey("nom")) {
                existingMateriel.setNom((String) requestMap.get("nom"));
            }
            if (requestMap.containsKey("description")) {
                existingMateriel.setDescription((String) requestMap.get("description"));
            }
            if (requestMap.containsKey("quantiteDisponible")) {
                existingMateriel.setQuantiteDisponible(Integer.parseInt(requestMap.get("quantiteDisponible").toString()));
            }
            if (requestMap.containsKey("categorie")) {
                existingMateriel.setCategorie(CategorieMateriel.valueOf((String) requestMap.get("categorie")));
            }

            // Validation
            if (existingMateriel.getNom() == null || existingMateriel.getNom().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Le nom est obligatoire");
            }

            Materiel updated = materielService.updateMateriel(id, existingMateriel);
            return ResponseEntity.ok(updated);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erreur: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMateriel(@PathVariable Long id) {
        materielService.deleteMateriel(id);
        return ResponseEntity.noContent().build();
    }
}
