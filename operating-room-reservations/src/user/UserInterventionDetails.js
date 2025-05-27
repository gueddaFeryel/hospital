import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import './UserInterventionDetails.css';

const UserInterventionDetails = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const intervention = state?.intervention;

    if (!intervention) {
        return (
            <div className="intervention-details-container">
                <div className="error-message">Aucune donnée d'intervention disponible</div>
                <button onClick={() => navigate(-1)} className="back-button">
                    Retour au calendrier
                </button>
            </div>
        );
    }

    return (
        <div className="intervention-details-container">
            <h2>Détails de l'intervention</h2>

            <div className="details-card">
                <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                        {intervention.type.replace(/_/g, ' ').toLowerCase()}
                    </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                        {format(new Date(intervention.date), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Heure de début:</span>
                    <span className="detail-value">
                        {intervention.startTime ? intervention.startTime.split('T')[1].substring(0, 5) : 'Non défini'}
                    </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Heure de fin:</span>
                    <span className="detail-value">
                        {intervention.endTime ? intervention.endTime.split('T')[1].substring(0, 5) : 'Non défini'}
                    </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Statut:</span>
                    <span className={`detail-value status-${intervention.statut.toLowerCase()}`}>
                        {intervention.statut.toLowerCase()}
                    </span>
                </div>

                {intervention.room && (
                    <>
                        <div className="detail-row">
                            <span className="detail-label">Salle:</span>
                            <span className="detail-value">
                                {intervention.room.name}
                            </span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Équipement:</span>
                            <span className="detail-value">
                                {intervention.room.equipment}
                            </span>
                        </div>
                    </>
                )}

                {intervention.equipeMedicale?.length > 0 && (
                    <div className="medical-team-section">
                        <h3>Équipe médicale</h3>
                        {intervention.equipeMedicale.map((staff, index) => (
                            <div key={index} className="staff-member">
                                <span className="staff-role">{staff.role.toLowerCase()}:</span>
                                <span className="staff-name">{staff.prenom} {staff.nom}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <button onClick={() => navigate(-1)} className="back-button">
                Retour au calendrier
            </button>
        </div>
    );
};

export default UserInterventionDetails;