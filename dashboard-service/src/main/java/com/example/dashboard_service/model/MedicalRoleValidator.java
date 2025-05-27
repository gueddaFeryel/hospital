package com.example.dashboard_service.model;



import com.example.dashboard_service.model.RoleMedical;
import com.example.dashboard_service.model.TypeIntervention;
import java.util.*;

public class MedicalRoleValidator {

    private static final Map<TypeIntervention, Set<RoleMedical>> ROLES_VALIDES_PAR_INTERVENTION = Map.of(
            // Chirurgiens (MEDECIN) spécialisés par type d'intervention
            TypeIntervention.CHIRURGIE_CARDIAQUE, Set.of(RoleMedical.MEDECIN),
            TypeIntervention.ORTHOPEDIQUE, Set.of(RoleMedical.MEDECIN),
            TypeIntervention.NEUROCHIRURGIE, Set.of(RoleMedical.MEDECIN),
            TypeIntervention.OPHTALMOLOGIQUE, Set.of(RoleMedical.MEDECIN),
            TypeIntervention.UROLOGIE, Set.of(RoleMedical.MEDECIN),
            TypeIntervention.GYNECOLOGIQUE, Set.of(RoleMedical.MEDECIN),
            TypeIntervention.AUTRE, Set.of(RoleMedical.MEDECIN, RoleMedical.ANESTHESISTE)
    );

    public static boolean isRoleValidForIntervention(RoleMedical role, TypeIntervention type) {
        // Rôles toujours valides (anesthésistes, infirmiers)
        if (Set.of(RoleMedical.ANESTHESISTE, RoleMedical.INFIRMIER).contains(role)) {
            return true;
        }
        return ROLES_VALIDES_PAR_INTERVENTION.getOrDefault(type, Collections.emptySet()).contains(role);
    }
}
