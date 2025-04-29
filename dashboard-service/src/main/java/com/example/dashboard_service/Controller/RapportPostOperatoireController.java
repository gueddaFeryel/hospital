package com.example.dashboard_service.Controller;

import com.example.dashboard_service.Service.RapportPostOperatoireService;
import com.example.dashboard_service.model.StatutRapport;
import com.example.dashboard_service.model.dto.RapportPostOperatoire;
import com.example.dashboard_service.model.dto.RapportPostOperatoireRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rapports-postoperatoires")
@CrossOrigin(origins = "http://localhost:3000",
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class RapportPostOperatoireController {

    @Autowired
    private RapportPostOperatoireService rapportService;

    // Handle OPTIONS requests
    @RequestMapping(method = RequestMethod.OPTIONS)
    public ResponseEntity handleOptions() {
        return ResponseEntity.ok().build();
    }
    @PostMapping("/intervention/{interventionId}/medecin/{medecinId}")
    public ResponseEntity<RapportPostOperatoire> creerRapport(
            @PathVariable Long interventionId,
            @PathVariable Long medecinId,
            @RequestBody RapportPostOperatoireRequest request) {

        RapportPostOperatoire rapport = new RapportPostOperatoire();
        rapport.setDiagnostic(request.getDiagnostic());
        rapport.setComplications(request.getComplications());
        rapport.setRecommandations(request.getRecommandations());
        rapport.setNotesInfirmier(request.getNotesInfirmier());
        rapport.setStatut(StatutRapport.BROUILLON);

        // These relationships would be set by service layer
        // intervention, medecin would be fetched and set

        RapportPostOperatoire savedRapport = rapportService.createRapport(
                interventionId,
                medecinId,
                rapport
        );

        return ResponseEntity.ok(savedRapport);
    }
    // In controller
    @PutMapping("/{id}")
    public ResponseEntity<RapportPostOperatoire> mettreAJourRapport(
            @PathVariable Long id,
            @RequestBody Map<String, String> updates, // Use String instead of Object
            @RequestHeader("X-User-Id") Long userId) {

        if (!updates.containsKey("diagnostic") || !updates.containsKey("recommandations")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Required fields missing");
        }

        return ResponseEntity.ok(rapportService.mettreAJourRapport(id, updates, userId));
    }

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
}