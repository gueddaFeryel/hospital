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
import java.util.Set;

@RestController
@RequestMapping("/api/materiels")
@CrossOrigin(origins = "http://localhost:3000")
public class MaterielController {

    @Autowired
    private MaterielService materielService;

    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,  // Accepte aussi "application/json;charset=UTF-8"
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> createMateriel(@RequestBody Materiel materiel) {
        System.out.println("Reçu: " + materiel); // Debug
        try {
            Materiel saved = materielService.createMateriel(materiel);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace(); // Affiche l'erreur dans les logs
            return ResponseEntity.badRequest().body(e.getMessage());
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

    @PutMapping("/{id}")
    public ResponseEntity<Materiel> updateMateriel(@PathVariable Long id, @RequestBody Materiel updatedMateriel) {
        Materiel materiel = materielService.updateMateriel(id, updatedMateriel);
        return ResponseEntity.ok(materiel);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMateriel(@PathVariable Long id) {
        materielService.deleteMateriel(id);
        return ResponseEntity.noContent().build();
    }
}
