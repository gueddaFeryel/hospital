package com.example.dashboard_service.Service;

import com.example.dashboard_service.Repository.MedicalStaffRepository;
import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.MedicalStaff;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Date;
import java.util.Set;

@Service
public class NotificationService {

    @Autowired
    private MedicalStaffRepository medicalStaffRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    @Qualifier("taskScheduler")
    private TaskScheduler taskScheduler;

    // Méthode pour notifier l'équipe médicale d'une intervention
    public void notifierMedicalStaff(InterventionChirurgicale intervention) {
        // Utilisation de l'équipe médicale liée à l'intervention
        Set<MedicalStaff> staffList = intervention.getEquipeMedicale();

        for (MedicalStaff staff : staffList) {
            // Envoi d'un email à chaque membre de l'équipe
            emailService.envoyerEmail(
                    staff.getEmail(),
                    "Nouvelle intervention",
                    "Bonjour " + staff.getNom() + ",\nUne intervention est prévue le " + intervention.getDate() + "."
            );
        }
    }

    // Planifier un rappel 24 heures avant l'intervention
    public void planifierRappel24hAvant(InterventionChirurgicale intervention) {
        if (intervention.getDate() == null) return;

        // Calculer l'heure de l'intervention et l'heure de rappel (24h avant)
        Instant interventionTime = intervention.getDate().atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant reminderTime = interventionTime.minus(Duration.ofHours(24));

        // Planifier l'envoi du rappel à 24 heures avant l'intervention
        taskScheduler.schedule(() -> notifierMedicalStaff(intervention), Date.from(reminderTime));
    }
}
