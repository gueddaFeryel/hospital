package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.MaterielRepository;
import com.example.dashboard_service.model.CategorieMateriel;
import com.example.dashboard_service.model.Materiel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class MaterielService {

    @Autowired
    private MaterielRepository materielRepository;

    @Transactional
    public Materiel createMateriel(Materiel materiel) {
        // Validation des champs obligatoires
        if (materiel.getNom() == null || materiel.getNom().trim().isEmpty()) {
            throw new IllegalArgumentException("Le nom du matériel est obligatoire");
        }

        if (materiel.getDescription() == null || materiel.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("La description est obligatoire");
        }

        if (materiel.getQuantiteDisponible() == null || materiel.getQuantiteDisponible() <= 0) {
            throw new IllegalArgumentException("La quantité doit être un nombre positif");
        }

        // Nettoyage
        materiel.setNom(materiel.getNom().trim());
        materiel.setDescription(materiel.getDescription().trim());

        // Vérification de l'unicité
        if (materielRepository.existsByNom(materiel.getNom())) {
            throw new IllegalArgumentException("Un matériel avec ce nom existe déjà");
        }

        // Valeur par défaut
        if (materiel.getCategorie() == null) {
            materiel.setCategorie(CategorieMateriel.CONSOMMABLE);
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

    public Materiel updateMateriel(Long id, Materiel updatedMateriel) {
        return materielRepository.findById(id)
                .map(materiel -> {
                    materiel.setNom(updatedMateriel.getNom());
                    materiel.setDescription(updatedMateriel.getDescription());
                    materiel.setQuantiteDisponible(updatedMateriel.getQuantiteDisponible());
                    materiel.setCategorie(updatedMateriel.getCategorie());
                    return materielRepository.save(materiel);
                })
                .orElseGet(() -> {
                    updatedMateriel.setId(id);
                    return materielRepository.save(updatedMateriel);
                });
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
}
