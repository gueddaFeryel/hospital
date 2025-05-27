package com.example.UserService.controller;

import com.example.UserService.model.Reservation;
import com.example.UserService.repository.ReservationRepository;
import com.example.UserService.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE},
        allowedHeaders = "*")
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;
    @Autowired
    private ReservationRepository reservationRepository;

    @PostMapping("/{roomName}")
    public ResponseEntity<Reservation> createReservation(
            @PathVariable String roomName,
            @RequestBody Reservation reservation) {
        try {
            Reservation createdReservation = reservationService.createReservation(roomName, reservation);
            return new ResponseEntity<>(createdReservation, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage(), e);
        }
    }

    // Récupérer toutes les réservations
    @GetMapping
    public List<Reservation> getAllReservations() {
        return reservationService.getAllReservations();
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id) {
        reservationService.deleteReservation(id);
        return ResponseEntity.noContent().build();
    }
    // Ajoutez ce endpoint
    @DeleteMapping("/by-room/{roomId}")
    public ResponseEntity<Void> deleteReservationsByRoom(@PathVariable Long roomId) {
        reservationService.deleteByOperatingRoomId(roomId);
        return ResponseEntity.noContent().build();
    }

    // Ajoutez cette méthode dans votre contrôleur
    @GetMapping("/{id}")
    public ResponseEntity<Reservation> getReservationById(@PathVariable Long id) {
        try {
            Reservation reservation = reservationService.getReservationById(id);
            return ResponseEntity.ok(reservation);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        } catch (Exception e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur lors de la récupération de la réservation",
                    e
            );
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservation(
            @PathVariable Long id,
            @RequestBody Reservation reservationDetails) {
        try {
            Reservation updatedReservation = reservationService.updateReservation(id, reservationDetails);
            return ResponseEntity.ok(updatedReservation);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", LocalDateTime.now()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Erreur interne du serveur",
                    "timestamp", LocalDateTime.now()
            ));
        }
    }

    @GetMapping("/check-conflict")
    public ResponseEntity<Map<String, Boolean>> checkReservationConflict(
            @RequestParam String roomName,
            @RequestParam String startTime,
            @RequestParam String endTime,
            @RequestParam(required = false) Long excludeId) {

        LocalDateTime start = LocalDateTime.parse(startTime);
        LocalDateTime end = LocalDateTime.parse(endTime);
        LocalDateTime now = LocalDateTime.now();

        // Si la réservation est dans le passé, pas de conflit
        if (end.isBefore(now)) {
            return ResponseEntity.ok(Collections.singletonMap("hasConflict", false));
        }

        boolean hasConflict = reservationRepository.existsConflictingReservation(
                roomName, start, end, excludeId
        );

        return ResponseEntity.ok(Collections.singletonMap("hasConflict", hasConflict));
    }


}
