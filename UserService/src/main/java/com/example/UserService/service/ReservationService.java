package com.example.UserService.service;
import com.example.UserService.model.OperatingRoom;
import com.example.UserService.model.Reservation;
import com.example.UserService.repository.OperatingRoomRepository;
import com.example.UserService.repository.ReservationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
@Service
public class ReservationService {
    @Autowired
    private ReservationRepository reservationRepository;
    @Autowired
    private OperatingRoomRepository operatingRoomRepository;
    // Créer une réservation
    public Reservation createReservation(String roomName, Reservation reservation) {
        try {
            System.out.println("Recherche de la salle : " + roomName); // Débogage
            OperatingRoom operatingRoom = operatingRoomRepository.findByName(roomName);

            if (operatingRoom == null) {
                throw new IllegalArgumentException("La salle d'opération spécifiée n'existe pas.");
            }

            // Vérification de la disponibilité de la salle
            List<Reservation> existingReservations = reservationRepository.findByOperatingRoomIdAndStartTimeBetween(
                    operatingRoom.getId(),
                    reservation.getStartTime(),
                    reservation.getEndTime()
            );

            if (!existingReservations.isEmpty()) {
                throw new IllegalArgumentException("La salle d'opération est déjà réservée pour cette période.");
            }

            reservation.setOperatingRoom(operatingRoom);

            return reservationRepository.save(reservation);
        } catch (Exception e) {
            System.out.println("Erreur : " + e.getMessage()); // Afficher l'exception dans les logs
            throw new RuntimeException("Erreur interne lors de la réservation.", e);
        }
    }

    // Récupérer toutes les réservations
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }

    @Transactional
    public void deleteByOperatingRoomId(Long roomId) {
        reservationRepository.deleteByOperatingRoomId(roomId);
    }




    public Reservation getReservationById(Long id) {
        return reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Réservation non trouvée avec l'ID: " + id));
    }


    public Reservation updateReservation(Long reservationId, Reservation reservationDetails) {
        try {
            // 1. Vérifier que la réservation existe
            Reservation existingReservation = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new IllegalArgumentException("Réservation non trouvée avec l'ID: " + reservationId));

            // 2. Vérifier que les dates sont valides
            if (reservationDetails.getStartTime().isAfter(reservationDetails.getEndTime())) {
                throw new IllegalArgumentException("La date de fin doit être après la date de début");
            }

            // 3. Vérifier que la salle existe
            if (reservationDetails.getOperatingRoom() == null || reservationDetails.getOperatingRoom().getName() == null) {
                throw new IllegalArgumentException("La salle d'opération doit être spécifiée");
            }

            OperatingRoom operatingRoom = operatingRoomRepository.findByName(reservationDetails.getOperatingRoom().getName());
            if (operatingRoom == null) {
                throw new IllegalArgumentException("Salle d'opération non trouvée: " + reservationDetails.getOperatingRoom().getName());
            }

            // 4. Vérifier les conflits de réservation (en excluant la réservation actuelle)
            List<Reservation> conflicts = reservationRepository
                    .findByOperatingRoomIdAndStartTimeBetween(
                            operatingRoom.getId(),
                            reservationDetails.getStartTime(),
                            reservationDetails.getEndTime()
                    ).stream()
                    .filter(r -> !r.getId().equals(reservationId))
                    .toList();

            if (!conflicts.isEmpty()) {
                throw new IllegalArgumentException("La salle est déjà réservée pour cette période");
            }

            // 5. Mettre à jour les champs
            existingReservation.setStartTime(reservationDetails.getStartTime());
            existingReservation.setEndTime(reservationDetails.getEndTime());
            existingReservation.setOperatingRoom(operatingRoom);

            // 6. Sauvegarder
            return reservationRepository.save(existingReservation);

        } catch (IllegalArgumentException e) {
            System.err.println("Validation error: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Erreur système: " + e.getMessage());
            throw new RuntimeException("Erreur lors de la mise à jour de la réservation", e);
        }
    }
    public void deleteReservation(Long id) {
        // Check if reservation exists
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Reservation not found with id: " + id));

        // Delete the reservation
        reservationRepository.delete(reservation);
    }

    // ... rest of your service methods ...

}


