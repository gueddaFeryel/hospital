package com.example.dashboard_service.Repository;

import com.example.dashboard_service.model.MedicalStaff;
import com.example.dashboard_service.model.RoleMedical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicalStaffRepository extends JpaRepository<MedicalStaff, Long> {
    List<MedicalStaff> findByRole(RoleMedical role);



    @Query("SELECT m FROM MedicalStaff m WHERE m.firebaseUid IS NOT NULL AND m.firebaseUid = :uid")
    Optional<MedicalStaff> findByFirebaseUid(@Param("uid") String uid);

    Optional<MedicalStaff> findByEmail(String email);
}
