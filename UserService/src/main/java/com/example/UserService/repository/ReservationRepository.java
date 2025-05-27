package com.example.UserService.repository;

import com.example.UserService.model.Reservation;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByOperatingRoomIdAndStartTimeBetween(Long operatingRoomId, LocalDateTime start, LocalDateTime end);
    boolean existsById(Long id);
    Optional<Reservation> findById(Long id);



    // Suppression avec gestion transactionnelle
    @Transactional
    @Modifying(clearAutomatically = true)
    @Query("DELETE FROM Reservation r WHERE r.operatingRoom.id = :roomId")
    int deleteByOperatingRoomId(@Param("roomId") Long roomId);

    // Recherche des conflits avec requête optimisée
    @Query("""
           SELECT r FROM Reservation r 
           WHERE r.operatingRoom.id = :roomId 
           AND (:excludeReservationId IS NULL OR r.id != :excludeReservationId)
           AND (r.startTime < :endTime AND r.endTime > :startTime)
           ORDER BY r.startTime
           """)
    List<Reservation> findConflictingReservations(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeReservationId") Long excludeReservationId);




    List<Reservation> findByOperatingRoomName(String roomName);
    // Vérifier les conflits de réservation avec une requête personnalisée
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END " +
            "FROM Reservation r WHERE " +
            "r.operatingRoom.name = :roomName AND " +
            "((:startTime < r.endTime) AND (:endTime > r.startTime)) AND " +
            "(:excludeId IS NULL OR r.id <> :excludeId)")
    boolean existsConflictingReservation(
            @Param("roomName") String roomName,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeId") Long excludeId);

}