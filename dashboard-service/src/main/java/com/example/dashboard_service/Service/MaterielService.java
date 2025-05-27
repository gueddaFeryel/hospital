package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.Repository.MaterielRepository;
import com.example.dashboard_service.model.CategorieMateriel;
import com.example.dashboard_service.model.ErrorResponse;
import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.Materiel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MaterielService {

    @Autowired
    private MaterielRepository materielRepository;

    @Autowired
    private InterventionRepository interventionRepository;

    @Transactional
    public Materiel createMateriel(Materiel materiel) {
        // Vérification d'unicité du nom
        if (materielRepository.existsByNom(materiel.getNom())) {
            throw new IllegalArgumentException("Un matériel avec ce nom existe déjà");
        }
        return materielRepository.save(materiel);
    }

    public List<Materiel> getAllMateriels() {
        return materielRepository.findAll();
    }

    public Optional<Materiel> getMaterielById(Long id) {
        return materielRepository.findById(id);
    }

    public List<Materiel> getMaterielsByCategorie(CategorieMateriel categorie) {
        return materielRepository.findByCategorie(categorie);
    }

    public List<Materiel> searchMateriels(String nom) {
        return materielRepository.findByNomContaining(nom);
    }

    @Transactional
    public Materiel updateMateriel(Long id, Materiel updatedMateriel) {
        Materiel existing = materielRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Matériel non trouvé"));

        existing.setNom(updatedMateriel.getNom());
        existing.setDescription(updatedMateriel.getDescription());
        existing.setQuantiteDisponible(updatedMateriel.getQuantiteDisponible());
        existing.setCategorie(updatedMateriel.getCategorie());

        return materielRepository.save(existing);
    }

    public void deleteMateriel(Long id) {
        materielRepository.deleteById(id);
    }

    @Transactional
    public void verifierDisponibiliteMateriels(Set<Materiel> materiels) {
        for (Materiel materiel : materiels) {
            Materiel m = materielRepository.findById(materiel.getId())
                    .orElseThrow(() -> new RuntimeException("Matériel non trouvé: " + materiel.getId()));

            if (m.getQuantiteDisponible() <= 0) {
                throw new RuntimeException("Matériel non disponible: " + m.getNom());
            }
        }
    }



    public List<Materiel> getAvailableMaterials() {
        return materielRepository.findByQuantiteDisponibleGreaterThan(0);
    }

    public List<Materiel> getAvailableMaterialsForIntervention(Long interventionId) {
        // 1. Récupérer tous les matériels disponibles
        List<Materiel> allAvailable = materielRepository.findByQuantiteDisponibleGreaterThan(0);

        // 2. Récupérer les matériels déjà assignés à cette intervention
        Optional<InterventionChirurgicale> intervention = interventionRepository.findById(interventionId);
        Set<Materiel> alreadyAssigned = intervention.map(InterventionChirurgicale::getMateriels)
                .orElse(Collections.emptySet());

        // 3. Combiner les résultats (matériels disponibles + ceux déjà assignés)
        List<Materiel> result = new ArrayList<>(allAvailable);
        result.addAll(alreadyAssigned);

        // Éliminer les doublons
        return result.stream()
                .distinct()
                .collect(Collectors.toList());
    }





    @Transactional
    public ResponseEntity<?> ajusterStock(Long materielId, int quantite, boolean augmentation) {
        try {
            Materiel materiel = materielRepository.findById(materielId)
                    .orElseThrow(() -> new IllegalArgumentException("Matériel non trouvé"));

            // Validation
            if (quantite <= 0) {
                throw new IllegalArgumentException("La quantité doit être positive");
            }

            // Modification
            int nouveauStock = augmentation
                    ? materiel.getQuantiteDisponible() + quantite
                    : materiel.getQuantiteDisponible() - quantite;

            if (nouveauStock < 0) {
                throw new IllegalStateException(
                        String.format("Opération impossible. Stock actuel : %d, tentative de retrait : %d",
                                materiel.getQuantiteDisponible(),
                                quantite)
                );
            }

            materiel.setQuantiteDisponible(nouveauStock);
            materielRepository.save(materiel);

            return ResponseEntity.ok(materiel);

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("AJUSTEMENT_STOCK_ERROR", e.getMessage()));
        }
    }
}
