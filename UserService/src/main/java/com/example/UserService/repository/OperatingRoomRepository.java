package com.example.UserService.repository;

import com.example.UserService.model.Category;
import com.example.UserService.model.OperatingRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OperatingRoomRepository extends JpaRepository<OperatingRoom, Long> {
    OperatingRoom findByName(String name);
    Optional<OperatingRoom> findById(Long id);

    List<OperatingRoom> findByCategory(Category category);

}
