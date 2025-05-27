package com.example.UserService.controller;

import com.example.UserService.model.Category;
import com.example.UserService.model.OperatingRoom;
import com.example.UserService.service.OperatingRoomService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/rooms")
public class OperatingRoomController {
    @Autowired
    private OperatingRoomService operatingRoomService;

    @GetMapping
    public List<OperatingRoom> getAllRooms() {
        return operatingRoomService.getAllRooms();
    }

    @PostMapping
    public OperatingRoom createRoom(@RequestBody OperatingRoom operatingRoom) {
        return operatingRoomService.createRoom(operatingRoom);
    }

    @GetMapping("/category/{category}")
    public List<OperatingRoom> getRoomsByCategory(@PathVariable String category) {
        // Conversion de la String en Enum
        Category categoryEnum = Category.valueOf(category.toUpperCase());
        return operatingRoomService.getRoomsByCategory(categoryEnum);
    }

    // Endpoint pour récupérer toutes les catégories disponibles
    @GetMapping("/categories")
    public Category[] getAllCategories() {
        return Category.values();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        operatingRoomService.deleteRoom(id);
        return ResponseEntity.noContent().build();
    }








    @GetMapping("/{id}")
    public ResponseEntity<?> getOperatingRoomById(@PathVariable Long id) {
        try {
            OperatingRoom room = operatingRoomService.getOperatingRoomById(id);
            return ResponseEntity.ok(room);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error", e.getMessage(),
                            "timestamp", LocalDateTime.now()
                    ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "error", "Erreur interne du serveur",
                            "timestamp", LocalDateTime.now()
                    ));
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateOperatingRoom(
            @PathVariable Long id,
            @Valid @RequestBody OperatingRoom updatedRoom,
            BindingResult bindingResult) {

        // Validation des champs
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error ->
                    errors.put(error.getField(), error.getDefaultMessage()));
            return ResponseEntity.badRequest().body(errors);
        }

        try {
            OperatingRoom room = operatingRoomService.updateOperatingRoom(id, updatedRoom);
            return ResponseEntity.ok(room);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage(),
                    "timestamp", LocalDateTime.now()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }



    @GetMapping("/available")
    public ResponseEntity<List<OperatingRoom>> getAvailableRooms(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end,
            @RequestParam(required = false) String category) {

        Category categoryEnum = category != null ? Category.valueOf(category.toUpperCase()) : null;
        List<OperatingRoom> availableRooms = operatingRoomService.findAvailableRooms(start, end, categoryEnum);
        return ResponseEntity.ok(availableRooms);
    }

}
