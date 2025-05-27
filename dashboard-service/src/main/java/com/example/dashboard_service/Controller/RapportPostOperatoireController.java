package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Service.RapportPostOperatoireService;
import com.example.dashboard_service.model.StatutRapport;
import com.example.dashboard_service.model.dto.RapportPostOperatoire;
import com.example.dashboard_service.model.dto.RapportPostOperatoireRequest;
import com.example.dashboard_service.model.RoleMedical;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import javax.validation.Valid;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rapports-postoperatoires")
@CrossOrigin(origins = "http://localhost:3000")
public class RapportPostOperatoireController {

    @Autowired
    private RapportPostOperatoireService rapportService;

    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity handleOptions() {
        return ResponseEntity.ok().build();
    }


    @GetMapping
    public ResponseEntity<List<RapportPostOperatoire>> getAllRapports() {
        List<RapportPostOperatoire> rapports = rapportService.findAll();
        return ResponseEntity.ok(rapports);
    }
    @PostMapping("/intervention/{interventionId}")
    public ResponseEntity<RapportPostOperatoire> creerRapport(
            @PathVariable Long interventionId,
            @RequestBody @Valid RapportPostOperatoireRequest request,
            @RequestHeader("X-User-Role") String userRole,
            @RequestHeader("X-User-Id") Long medecinId) {  // Renommé pour plus de clarté

        if (!RoleMedical.MEDECIN.name().equals(userRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seuls les médecins peuvent créer des rapports post-opératoires"
            );
        }

        // Validation des IDs
        if (interventionId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "L'ID de l'intervention est requis"
            );
        }

        if (medecinId == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "L'ID du médecin est requis"
            );
        }

        RapportPostOperatoire rapport = new RapportPostOperatoire();
        rapport.setDiagnostic(request.getDiagnostic());
        rapport.setComplications(request.getComplications());
        rapport.setRecommandations(request.getRecommandations());
        rapport.setNotesInfirmier(request.getNotesInfirmier());
        rapport.setStatut(StatutRapport.BROUILLON);

        RapportPostOperatoire savedRapport = rapportService.createRapport(
                interventionId,
                medecinId,
                rapport
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(savedRapport);
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> mettreAJourRapport(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String userRole) {

        // Validation des headers
        if (userId == null || userRole == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Headers X-User-Id and X-User-Role are required"
            );
        }

        // Seuls les médecins peuvent utiliser cet endpoint
        if (!RoleMedical.MEDECIN.name().equals(userRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seuls les médecins peuvent modifier les rapports post-opératoires"
            );
        }

        // Validation du corps de la requête
        if (updates == null || updates.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Request body cannot be empty"
            );
        }

        // Vérification explicite que notesInfirmier n'est pas présent
        if (updates.containsKey("notesInfirmier")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Les notes infirmier doivent être modifiées via l'endpoint dédié PUT /{id}/notes-infirmier"
            );
        }

        // Traitement des autres champs
        try {
            RapportPostOperatoire updatedRapport = rapportService.mettreAJourRapport(id, updates, userId);
            return ResponseEntity.ok(updatedRapport);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur lors de la mise à jour du rapport: " + e.getMessage()
            );
        }
    }
    // Les méthodes GET restent accessibles à tous les rôles
    @GetMapping("/intervention/{interventionId}")
    public ResponseEntity<RapportPostOperatoire> getByIntervention(@PathVariable Long interventionId) {
        return rapportService.findByInterventionId(interventionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/medecin/{medecinId}")
    public List<RapportPostOperatoire> getByMedecin(@PathVariable Long medecinId) {
        return rapportService.findByMedecinId(medecinId);
    }

    @GetMapping("/infirmier/{infirmierId}")
    public List<RapportPostOperatoire> getByInfirmier(@PathVariable Long infirmierId) {
        return rapportService.findByInfirmierId(infirmierId);
    }




    @PutMapping("/{id}/notes-infirmier")
    public ResponseEntity<RapportPostOperatoire> ajouterNotesInfirmier(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader("X-User-Role") String userRole) {

        // Validation du rôle
        if (!RoleMedical.INFIRMIER.name().equals(userRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Seuls les infirmiers peuvent modifier les notes infirmier"
            );
        }

        // Validation du corps de la requête
        if (request == null || !request.containsKey("notesInfirmier") || request.get("notesInfirmier") == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Le champ 'notesInfirmier' est requis et ne peut pas être null"
            );
        }

        try {
            RapportPostOperatoire updatedRapport = rapportService.ajouterNotesInfirmier(
                    id,
                    request.get("notesInfirmier"),
                    userId
            );
            return ResponseEntity.ok(updatedRapport);
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur lors de la mise à jour des notes infirmier: " + e.getMessage()
            );
        }
    }






    @GetMapping("/intervention/{interventionId}/medecin/{medecinId}")
    public ResponseEntity<List<RapportPostOperatoire>> getByInterventionAndMedecin(
            @PathVariable Long interventionId,
            @PathVariable Long medecinId) {

        List<RapportPostOperatoire> rapports = rapportService.findByInterventionIdAndMedecinId(interventionId, medecinId);
        if (rapports.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rapports);
    }





    @GetMapping("/by-staff/{staffId}")
    public ResponseEntity<List<RapportPostOperatoire>> getByStaff(@PathVariable Long staffId) {
        List<RapportPostOperatoire> rapports = rapportService.findByStaffId(staffId);
        if (rapports.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(rapports);
    }
}
