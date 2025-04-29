package com.example.UserService.service;

import com.example.UserService.model.Category;
import com.example.UserService.model.OperatingRoom;
import com.example.UserService.model.Reservation;
import com.example.UserService.repository.OperatingRoomRepository;
import com.example.UserService.repository.ReservationRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OperatingRoomService {
    @Autowired
    private OperatingRoomRepository operatingRoomRepository;

   @Autowired
   private final ReservationService reservationService;
    @Autowired
    private ReservationRepository reservationRepository;
    public OperatingRoomService(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    public List<OperatingRoom> getAllRooms() {
        return operatingRoomRepository.findAll();
    }

    public OperatingRoom createRoom(OperatingRoom operatingRoom) {
        return operatingRoomRepository.save(operatingRoom);
    }

    public List<OperatingRoom> getRoomsByCategory(Category category) {
        return operatingRoomRepository.findByCategory(category);
    }
    @Transactional
    public void deleteRoom(Long id) {
        // D'abord supprimer les réservations associées
        reservationService.deleteByOperatingRoomId(id);

        // Puis supprimer la salle
        operatingRoomRepository.deleteById(id);
    }





    public OperatingRoom getOperatingRoomById(Long id) {
        return operatingRoomRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Salle d'opération non trouvée avec l'ID: " + id));
    }

    public OperatingRoom updateOperatingRoom(Long id, OperatingRoom updatedRoom) {
        // 1. Vérifier que la salle existe
        OperatingRoom existingRoom = operatingRoomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle d'opération non trouvée avec l'id: " + id));

        // 2. Validation des données
        if (updatedRoom.getName() == null || updatedRoom.getName().isBlank()) {
            throw new IllegalArgumentException("Le nom de la salle est obligatoire");
        }

        if (updatedRoom.getLocation() == null || updatedRoom.getLocation().isBlank()) {
            throw new IllegalArgumentException("L'emplacement est obligatoire");
        }

        if (updatedRoom.getCategory() == null) {
            throw new IllegalArgumentException("La catégorie est obligatoire");
        }

        // 3. Vérification du nom unique (si nécessaire)
        OperatingRoom roomWithSameName = operatingRoomRepository.findByName(updatedRoom.getName());
        if (roomWithSameName != null && !roomWithSameName.getId().equals(id)) {
            throw new IllegalArgumentException("Une salle avec ce nom existe déjà");
        }

        // 4. Mise à jour des champs
        existingRoom.setName(updatedRoom.getName());
        existingRoom.setLocation(updatedRoom.getLocation());
        existingRoom.setCategory(updatedRoom.getCategory());

        // 5. Sauvegarde
        return operatingRoomRepository.save(existingRoom);
    }



    public List<OperatingRoom> findAvailableRooms(LocalDateTime start, LocalDateTime end, Category category) {
        List<OperatingRoom> allRooms = category != null ?
                operatingRoomRepository.findByCategory(category) :
                operatingRoomRepository.findAll();

        return allRooms.stream()
                .filter(room -> isRoomAvailable(room.getId(), start, end))
                .collect(Collectors.toList());
    }

    private boolean isRoomAvailable(Long roomId, LocalDateTime start, LocalDateTime end) {
        List<Reservation> conflicts = reservationRepository.findByOperatingRoomIdAndStartTimeBetween(
                roomId, start, end);
        return conflicts.isEmpty();
    }


}
