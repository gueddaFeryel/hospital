package com.example.dashboard_service.Repository;




import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.Materiel;
import com.example.dashboard_service.model.StatutIntervention;
import com.example.dashboard_service.model.TypeIntervention;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface InterventionRepository extends JpaRepository<InterventionChirurgicale, Long> {
    @Query("SELECT DISTINCT m FROM InterventionChirurgicale i JOIN i.materiels m " +
            "WHERE i.id != :interventionId " +
            "AND ((i.startTime < :end AND i.endTime > :start))")
    List<Materiel> findMaterielsReservedBetween(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("interventionId") Long interventionId);
    List<InterventionChirurgicale> findByDate(LocalDate date);

    List<InterventionChirurgicale> findByStatut(StatutIntervention statut);

    List<InterventionChirurgicale> findByType(TypeIntervention type);

    List<InterventionChirurgicale> findByDateBetween(LocalDate startDate, LocalDate endDate);

    @Modifying
    @Query("UPDATE InterventionChirurgicale i SET i.statut = 'ANNULEE' WHERE i.id = :id")
    void annulerIntervention(@Param("id") Long id);



    @Query("SELECT i FROM InterventionChirurgicale i " +
            "JOIN i.equipeMedicale s " +
            "WHERE s.id = :staffId " +
            "AND ((i.startTime BETWEEN :start AND :end) OR (i.endTime BETWEEN :start AND :end))")
    List<InterventionChirurgicale> findByEquipeMedicaleIdAndDateTimeRange(
            @Param("staffId") Long staffId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);


    // In InterventionRepository.java
    @Query("SELECT DISTINCT i FROM InterventionChirurgicale i JOIN i.equipeMedicale s WHERE s.id = :staffId")
    List<InterventionChirurgicale> findByEquipeMedicaleId(@Param("staffId") Long staffId);




    @Query("SELECT i FROM InterventionChirurgicale i JOIN i.equipeMedicale s " +
            "WHERE s.id = :staffId " +
            "AND i.id != :currentInterventionId " +
            "AND (" +
            "   (i.startTime IS NOT NULL AND i.endTime IS NOT NULL AND " +
            "   NOT (i.endTime <= :start OR i.startTime >= :end)) " +
            "OR " +
            "   (i.startTime IS NULL AND i.date = :date))")
    List<InterventionChirurgicale> findConflictingInterventions(
            @Param("staffId") Long staffId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("currentInterventionId") Long currentInterventionId,
            @Param("date") LocalDate date);




    List<InterventionChirurgicale> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);


    @Query("SELECT COUNT(i) > 0 FROM InterventionChirurgicale i WHERE " +
            "i.roomId = :roomId AND " +
            "i.statut NOT IN (com.example.dashboard_service.model.StatutIntervention.ANNULEE, " +
            "com.example.dashboard_service.model.StatutIntervention.TERMINEE) AND " +
            "((i.startTime < :end AND i.endTime > :start) OR " +
            "(i.startTime = :start AND i.endTime = :end)) AND " +
            "(i.id != :excludeId OR :excludeId IS NULL)")
    boolean existsByRoomIdAndTimeRange(
            @Param("roomId") Long roomId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            @Param("excludeId") Long excludeId);
}
