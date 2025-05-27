package com.example.dashboard_service.Service;
import com.example.dashboard_service.Repository.InterventionRepository;
import com.example.dashboard_service.model.InterventionChirurgicale;
import com.example.dashboard_service.model.MedicalStaff;
import com.example.dashboard_service.model.StatutIntervention;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
@Service
public class EmailService {
    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final InterventionRepository interventionRepository;
    private final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

    @Value("${spring.mail.username}")
    private String fromEmail;
    @Autowired
    private JavaMailSender javaMailSender;
    @Autowired



    private static final Logger log = LoggerFactory.getLogger(EmailService.class);


    public EmailService(JavaMailSender mailSender, InterventionRepository interventionRepository) {
        this.mailSender = mailSender;
        this.interventionRepository = interventionRepository;
    }


    public void envoyerEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("rnferielfaryoula590@gmail.com"); // Ton email
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }
    public void sendEmail(String to, String subject, String text) {
        System.out.println("Envoi de l'email à " + to);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        try {
            javaMailSender.send(message);
            System.out.println("Email envoyé avec succès !");
        } catch (Exception e) {
            e.printStackTrace();
            System.out.println("Erreur lors de l'envoi de l'email.");
        }
    }

    public void sendInterventionNotification(InterventionChirurgicale intervention, String subject, String message) {
        if (intervention == null) return;

        Set<MedicalStaff> staff = intervention.getEquipeMedicale();
        if (staff == null || staff.isEmpty()) return;

        List<String> emails = staff.stream()
                .map(MedicalStaff::getEmail)
                .filter(email -> email != null && !email.isEmpty())
                .collect(Collectors.toList());

        if (emails.isEmpty()) return;

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(emails.toArray(new String[0]));
            helper.setSubject(subject);
            helper.setText(buildEmailContent(intervention, message), true);

            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    public void sendReminder(InterventionChirurgicale intervention) {
        logger.info("Tentative d'envoi de rappel pour intervention ID: {}", intervention.getId());

        if (intervention == null || intervention.getStatut() != StatutIntervention.PLANIFIEE) {
            logger.warn("Intervention invalide ou non planifiée - Annulation");
            return;
        }

        Set<MedicalStaff> staff = intervention.getEquipeMedicale();
        if (staff == null || staff.isEmpty()) {
            logger.warn("Aucun staff trouvé pour l'intervention ID: {}", intervention.getId());
            return;
        }

        List<String> emails = staff.stream()
                .map(MedicalStaff::getEmail)
                .filter(email -> email != null && !email.isEmpty())
                .collect(Collectors.toList());

        logger.debug("Emails trouvés: {}", emails);

        if (emails.isEmpty()) {
            logger.warn("Aucun email valide trouvé pour l'intervention ID: {}", intervention.getId());
            return;
        }

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(emails.toArray(new String[0]));
            helper.setSubject("🔔 Rappel: Intervention programmée demain");
            helper.setText(buildReminderContent(intervention), true);

            mailSender.send(mimeMessage);
            logger.info("Email envoyé avec succès pour l'intervention ID: {}", intervention.getId());

        } catch (MessagingException e) {
            logger.error("Échec d'envoi pour l'intervention ID: {} - Erreur: {}", intervention.getId(), e.getMessage());
            throw new RuntimeException("Failed to send reminder email", e);
        }
    }

    @Scheduled(cron = "0 0 9 * * ?") // Exécuté tous les jours à 9h
    public void sendDailyReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<InterventionChirurgicale> interventions = interventionRepository.findByDate(tomorrow);

        interventions.forEach(this::sendReminder);
    }

    private String buildEmailContent(InterventionChirurgicale intervention, String message) {
        String startTime = formatTime(intervention.getStartTime());
        String endTime = formatTime(intervention.getEndTime());

        return String.format("""
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .header { color: #2c3e50; }
                        table { border-collapse: collapse; width: 100%%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h2 class="header">Notification d'intervention</h2>
                    <p>%s</p>
                    <table>
                        <tr><th>ID</th><td>%d</td></tr>
                        <tr><th>Date</th><td>%s</td></tr>
                        <tr><th>Heure</th><td>%s - %s</td></tr>
                        <tr><th>Type</th><td>%s</td></tr>
                        <tr><th>Salle</th><td>%s</td></tr>
                        <tr><th>Statut</th><td>%s</td></tr>
                    </table>
                    <p>Cordialement,<br/>L'équipe médicale</p>
                </body>
            </html>
            """,
                message,
                intervention.getId(),
                intervention.getDate().format(dateFormatter),
                startTime,
                endTime,
                intervention.getType(),
                intervention.getRoomId() != null ? "Salle " + intervention.getRoomId() : "Non attribuée",
                intervention.getStatut()
        );
    }

    private String buildReminderContent(InterventionChirurgicale intervention) {
        String startTime = formatTime(intervention.getStartTime());
        String endTime = formatTime(intervention.getEndTime());

        return String.format("""
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .header { color: #2c3e50; }
                        .reminder { background-color: #fff8e1; padding: 15px; border-radius: 5px; }
                        table { border-collapse: collapse; width: 100%%; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                    </style>
                </head>
                <body>
                    <h2 class="header">Rappel d'intervention</h2>
                    <div class="reminder">
                        <p>Vous avez une intervention prévue demain. Voici les détails :</p>
                        <table>
                            <tr><th>ID</th><td>%d</td></tr>
                            <tr><th>Date</th><td>%s</td></tr>
                            <tr><th>Heure</th><td>%s - %s</td></tr>
                            <tr><th>Type</th><td>%s</td></tr>
                            <tr><th>Salle</th><td>%s</td></tr>
                        </table>
                        <p>Merci de préparer tout le matériel nécessaire.</p>
                    </div>
                    <p>Cordialement,<br/>L'équipe médicale</p>
                </body>
            </html>
            """,
                intervention.getId(),
                intervention.getDate().format(dateFormatter),
                startTime,
                endTime,
                intervention.getType(),
                intervention.getRoomId() != null ? "Salle " + intervention.getRoomId() : "Non attribuée"
        );
    }

    private String formatTime(LocalDateTime time) {
        return time != null ? time.format(timeFormatter) : "Non spécifié";
    }

}
