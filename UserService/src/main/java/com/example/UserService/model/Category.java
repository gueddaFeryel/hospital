package com.example.UserService.model;



public enum Category {
    COEUR("Coeur"),
    YEUX("Yeux"),
    ORTHOPEDIE("Orthopédie"),
    NEUROLOGIE("Neurologie"),
    GENERAL("Général");

    private final String displayName;

    Category(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
