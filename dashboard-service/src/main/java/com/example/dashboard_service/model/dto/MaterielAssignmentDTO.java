package com.example.dashboard_service.model.dto;

public class MaterielAssignmentDTO {
    private Long materialId;
    private Integer quantity;
    public MaterielAssignmentDTO() {}
    // Getters et Setters
    public Long getMaterialId() { return materialId; }
    public void setMaterialId(Long materialId) { this.materialId = materialId; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

}
