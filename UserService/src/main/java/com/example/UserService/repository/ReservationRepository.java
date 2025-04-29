package com.example.UserService.repository;

import com.example.UserService.model.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    // Trouver des réservations par salle et période
    List<Reservation> findByOperatingRoomIdAndStartTimeBetween(Long operatingRoomId, LocalDateTime start, LocalDateTime end);
    boolean existsById(Long id);

    Optional<Reservation> findById(Long id);
    @Modifying
    @Query("DELETE FROM Reservation r WHERE r.operatingRoom.id = :roomId")
    void deleteByOperatingRoomId(@Param("roomId") Long roomId);

    @Query("SELECT r FROM Reservation r WHERE " +
            "r.operatingRoom.id = :roomId AND " +
            "r.id != :excludeReservationId AND " +
            "((r.startTime < :endTime) AND (r.endTime > :startTime))")
    List<Reservation> findConflictingReservations(
            @Param("roomId") Long roomId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeReservationId") Long excludeReservationId);
}

