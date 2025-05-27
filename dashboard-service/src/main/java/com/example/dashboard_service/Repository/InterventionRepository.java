package com.example.dashboard_service.Repository;




import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.Materiel;
import com.example.dashboard_service.model.StatutIntervention;
import com.example.dashboard_service.model.TypeIntervention;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    List<InterventionChirurgicale> findByStatutAndEndTimeBefore(StatutIntervention statut, LocalDateTime endTime);

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


    @Query("SELECT COUNT(i) FROM InterventionChirurgicale i " +
            "JOIN i.materiels m " +
            "WHERE m.id = :materielId " +
            "AND i.statut NOT IN (com.example.dashboard_service.model.StatutIntervention.TERMINEE, com.example.dashboard_service.model.StatutIntervention.ANNULEE)")
    long countMaterielInNonCompletedInterventions(@Param("materielId") Long materielId);


    @Query("SELECT m.id as materielId, COUNT(i) as usageCount " +
            "FROM InterventionChirurgicale i " +
            "JOIN i.materiels m " +
            "WHERE i.statut NOT IN (com.example.dashboard_service.model.StatutIntervention.TERMINEE, " +
            "com.example.dashboard_service.model.StatutIntervention.ANNULEE) " +
            "GROUP BY m.id")
    List<Object[]> countAllMaterielsInNonCompletedInterventions();


    @Query("SELECT i FROM InterventionChirurgicale i WHERE i.statut = :statut AND i.startTime <= :now")
    List<InterventionChirurgicale> findByStatutAndStartTimeLessThanEqual(
            @Param("statut") StatutIntervention statut,
            @Param("now") LocalDateTime now);

    @Query("SELECT i FROM InterventionChirurgicale i WHERE i.statut = :statut AND i.endTime < :now")
    List<InterventionChirurgicale> findByStatutAndEndTimeLessThan(
            @Param("statut") StatutIntervention statut,
            @Param("now") LocalDateTime now);


    @Query("SELECT CASE WHEN COUNT(i) > 0 THEN false ELSE true END " +
            "FROM InterventionChirurgicale i " +
            "WHERE i.roomId = :roomId " +
            "AND i.id != :excludeId " +
            "AND ((i.startTime < :endTime AND i.endTime > :startTime))")
    boolean isRoomAvailable(@Param("roomId") Long roomId,
                            @Param("startTime") LocalDateTime startTime,
                            @Param("endTime") LocalDateTime endTime,
                            @Param("excludeId") Long excludeId);

    List<InterventionChirurgicale> findByMaterielsIdAndEndTimeAfter(Long materielId, LocalDateTime date);

    // OU avec une requête JPQL explicite pour plus de clarté :
    @Query("SELECT i FROM InterventionChirurgicale i JOIN i.materiels m WHERE m.id = :materielId AND i.endTime > :currentTime")
    List<InterventionChirurgicale> findActiveInterventionsUsingMaterial(
            @Param("materielId") Long materielId,
            @Param("currentTime") LocalDateTime currentTime);

    @Query("SELECT COUNT(i) FROM InterventionChirurgicale i " +
            "JOIN i.equipeMedicale staff " +
            "WHERE staff.id = :staffId " +
            "AND (i.startTime < :endTime AND i.endTime > :startTime) " +
            "AND i.statut NOT IN (com.example.dashboard_service.model.StatutIntervention.ANNULEE, " +
            "com.example.dashboard_service.model.StatutIntervention.TERMINEE)")
    long countByStaffAndTimeRange(@Param("staffId") Long staffId,
                                  @Param("startTime") LocalDateTime startTime,
                                  @Param("endTime") LocalDateTime endTime);



    @Query("SELECT DISTINCT i FROM InterventionChirurgicale i " +
            "LEFT JOIN FETCH i.equipeMedicale " +
            "LEFT JOIN FETCH i.materiels " +
            "WHERE i.id = :id")
    Optional<InterventionChirurgicale> findByIdWithStaffAndMaterials(@Param("id") Long id);







    @EntityGraph(attributePaths = {"materiels", "equipeMedicale"})
    @Query("SELECT i FROM InterventionChirurgicale i WHERE i.id = :id")
    InterventionChirurgicale findByIdWithDetails(@Param("id") Long id);






    List<InterventionChirurgicale> findByStartTimeBetweenAndStatut(
            LocalDateTime start,
            LocalDateTime end,
            StatutIntervention statut
    );



    @Query("SELECT DISTINCT i FROM InterventionChirurgicale i LEFT JOIN FETCH i.materiels WHERE i.endTime < :now AND i.statut <> 'TERMINEE'")
    List<InterventionChirurgicale> findInterventionsToCompleteWithMaterials(@Param("now") LocalDateTime now);





    List<InterventionChirurgicale> findByEndTimeBeforeAndStatutNot(
            LocalDateTime endTime,
            StatutIntervention statut);




    @Query("SELECT DISTINCT i FROM InterventionChirurgicale i LEFT JOIN FETCH i.equipeMedicale WHERE i.id = :id")
    Optional<InterventionChirurgicale> findByIdWithMedicalTeam(@Param("id") Long id);




    @EntityGraph(attributePaths = "materiels")
    Optional<InterventionChirurgicale> findWithMaterielsById(Long id);



    @Query("SELECT i FROM InterventionChirurgicale i LEFT JOIN FETCH i.equipeMedicale WHERE i.startTime BETWEEN :start AND :end AND i.statut = :statut")
    List<InterventionChirurgicale> findByStartTimeBetweenAndStatutWithEquipeMedicale(LocalDateTime start, LocalDateTime end, StatutIntervention statut);





}
