
package com.example.dashboard_service.Repository;

import com.example.dashboard_service.model.CategorieMateriel;
import com.example.dashboard_service.model.Materiel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MaterielRepository extends JpaRepository<Materiel, Long> {
    List<Materiel> findByCategorie(CategorieMateriel categorie);
    List<Materiel> findByNomContaining(String nom);
    Optional<Materiel> findByNom(String nom);
    boolean existsByNom(String nom);
    List<Materiel> findByQuantiteDisponibleGreaterThan(int quantite);






}
