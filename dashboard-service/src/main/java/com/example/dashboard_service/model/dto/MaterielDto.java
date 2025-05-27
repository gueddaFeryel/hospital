package com.example.dashboard_service.model.dto;

import com.example.dashboard_service.model.CategorieMateriel;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
@Getter
@Setter
public class MaterielDto {
    @NotBlank(message = "Le nom est obligatoire")
    @Size(min = 2, max = 100)
    private String nom;

    @NotBlank(message = "La description est obligatoire")
    @Size(min = 5, max = 255)
    private String description;

    @Min(value = 1, message = "La quantité doit être ≥1")
    private Integer quantiteDisponible;

    @NotBlank(message = "La catégorie est obligatoire")
    private CategorieMateriel categorie;
    public CategorieMateriel getCategorie() {
        return categorie;
    }

    public void setCategorie(CategorieMateriel categorie) {
        this.categorie = categorie;
    }
    // Getters/Setters
}
