import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserMd,
    faProcedures,
    faCalendarCheck,
    faSync,
    faChevronRight,
    faHospital,
    faClock,
    faMapMarkerAlt,
    faUsers,
    faNotesMedical,
    faUserCircle,
    faPhone,
    faEnvelope,
    faCalendarAlt,
    faFileMedical,
    faPlus,
    faCheck
} from '@fortawesome/free-solid-svg-icons';
import './UserCalendarView.css';

const UserCalendarView = () => {
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [date, setDate] = useState(new Date());
    const [selectedInterventions, setSelectedInterventions] = useState([]);
    const [selectedIntervention, setSelectedIntervention] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showRapportForm, setShowRapportForm] = useState(false);
    const [rapport, setRapport] = useState(null);
    const [rapportForm, setRapportForm] = useState({
        diagnostic: '',
        complications: '',
        recommandations: '',
        notesInfirmier: ''
    });
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const fetchInterventions = useCallback(async () => {
        try {
            if (!currentUser?.uid) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }

            setLoading(true);

            const staffResponse = await axios.get(`http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`);
            const staffId = staffResponse.data?.id;

            if (!staffId) {
                setInterventions([]);
                setLoading(false);
                return;
            }

            const interventionsResponse = await axios.get(`http://localhost:8089/api/interventions/by-staff/${staffId}`);

            const formattedInterventions = interventionsResponse.data.map(intervention => ({
                ...intervention,
                date: intervention.date ? parseISO(intervention.date) : null,
                startTime: intervention.startTime ? parseISO(intervention.startTime) : null,
                endTime: intervention.endTime ? parseISO(intervention.endTime) : null
            }));

            setInterventions(formattedInterventions);
        } catch (err) {
            console.error("Error fetching interventions:", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const fetchRapport = async (interventionId) => {
        try {
            const response = await axios.get(`http://localhost:8089/api/rapports-postoperatoires/intervention/${interventionId}`);
            if (response.data) {
                setRapport(response.data);
                setRapportForm({
                    diagnostic: response.data.diagnostic || '',
                    complications: response.data.complications || '',
                    recommandations: response.data.recommandations || '',
                    notesInfirmier: response.data.notesInfirmier || ''
                });
            } else {
                setRapport(null);
                setRapportForm({
                    diagnostic: '',
                    complications: '',
                    recommandations: '',
                    notesInfirmier: ''
                });
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setRapport(null);
            } else {
                console.error("Error fetching rapport:", err);
            }
        }
    };

    useEffect(() => {
        fetchInterventions();
        const refreshInterval = setInterval(fetchInterventions, 30000);
        return () => clearInterval(refreshInterval);
    }, [fetchInterventions]);

    useEffect(() => {
        const filtered = interventions.filter(intervention => {
            if (!intervention.date) return false;
            return isSameDay(intervention.date, date);
        });
        setSelectedInterventions(filtered);
    }, [date, interventions]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        setShowDetails(false);
        setShowRapportForm(false);
    };

    const handleSelectIntervention = (intervention) => {
        setSelectedIntervention(intervention);
        setShowDetails(true);
        fetchRapport(intervention.id);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setShowRapportForm(false);
    };

    const handleOpenRapportForm = () => {
        setShowRapportForm(true);
    };

    const handleCloseRapportForm = () => {
        setShowRapportForm(false);
    };

    const handleRapportInputChange = (e) => {
        const { name, value } = e.target;
        setRapportForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateRapport = async () => {
        try {
            // First get the staff ID for the current user
            const staffResponse = await axios.get(
                `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
            );
            const staffId = staffResponse.data?.id;

            if (!staffId) {
                throw new Error("Medical staff ID not found");
            }

            // Prepare the complete rapport data with all required fields
            const rapportData = {
                diagnostic: rapportForm.diagnostic,
                complications: rapportForm.complications || null, // Optional field
                recommandations: rapportForm.recommandations,
                notesInfirmier: rapportForm.notesInfirmier || null, // Optional field
                statut: "BROUILLON", // Default status
                // These will typically be set by backend but you can include:
                intervention_id: selectedIntervention.id,
                medecin_id: staffId,
                // Dates will be set by backend automatically
                // date_creation: new Date().toISOString(), // Usually auto-set
                // date_soumission: null, // Will be set when submitted
                // infirmier_id: null // Can be added later
            };

            console.log("Submitting rapport data:", rapportData);

            const response = await axios.post(
                `http://localhost:8089/api/rapports-postoperatoires/intervention/${selectedIntervention.id}/medecin/${staffId}`,
                rapportData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            setRapport(response.data);
            setShowRapportForm(false);
            alert('Rapport créé avec succès!');
        } catch (err) {
            console.error("Error creating rapport:", err);
            alert(`Erreur: ${err.response?.data?.message || err.message || 'Erreur lors de la création du rapport'}`);
        }
    };

    const handleUpdateRapport = async () => {
        try {
            // 1. Get current user's medical staff ID
            const staffResponse = await axios.get(
                `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
            );
            const staffId = staffResponse.data?.id;

            if (!staffId) {
                throw new Error("Medical staff ID not found");
            }

            // 2. Prepare the request
            const response = await axios.put(
                `http://localhost:8089/api/rapports-postoperatoires/${rapport.id}`,
                rapportForm,  // Send the complete form data
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': staffId  // Send the medical staff ID as user ID
                    }
                }
            );

            setRapport(response.data);
            setShowRapportForm(false);
            alert('Rapport mis à jour avec succès!');
        } catch (err) {
            console.error("Error updating rapport:", err);
            const errorMessage = err.response?.data?.message ||
                err.response?.data ||
                err.message ||
                'Erreur lors de la mise à jour du rapport';
            alert(`Erreur: ${errorMessage}`);
        }
    };

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;

        const dayInterventions = interventions.filter(intervention =>
            intervention.date && isSameDay(intervention.date, date)
        ).slice(0, 3);

        return (
            <div className="day-interventions">
                {dayInterventions.map((intervention, index) => {
                    let icon = faCalendarCheck;
                    let color = 'var(--primary-color)';

                    switch(intervention.type) {
                        case 'CHIRURGIE':
                            icon = faProcedures;
                            color = 'var(--danger-color)';
                            break;
                        case 'CONSULTATION':
                            icon = faUserMd;
                            color = 'var(--success-color)';
                            break;
                    }

                    return (
                        <div key={index} className="intervention-marker" style={{ color }}>
                            <FontAwesomeIcon icon={icon} />
                        </div>
                    );
                })}
                {dayInterventions.length > 3 && (
                    <div className="more-interventions">+{dayInterventions.length - 3}</div>
                )}
            </div>
        );
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des interventions...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-alert">
                <h3>Erreur</h3>
                <p>{error}</p>
                <button onClick={fetchInterventions} className="retry-btn">
                    Réessayer
                </button>
            </div>
        </div>
    );

    return (
        <div className="modern-calendar-container">
            <header className="calendar-header">
                <div className="header-content">
                    <div className="title-section">
                        <FontAwesomeIcon icon={faHospital} className="header-icon" />
                        <h1>Mon Calendrier Médical</h1>
                    </div>
                    <button onClick={fetchInterventions} className="refresh-btn">
                        <FontAwesomeIcon icon={faSync} />
                        <span>Actualiser</span>
                    </button>
                </div>
                <p className="subtitle">Visualisation des interventions programmées</p>
            </header>

            <main className="calendar-content">
                <div className="calendar-section">
                    <div className="calendar-wrapper">
                        <Calendar
                            onChange={handleDateChange}
                            value={date}
                            locale="fr-FR"
                            tileContent={tileContent}
                            className="modern-calendar"
                            navigationLabel={({ date }) => format(date, 'MMMM yyyy', { locale: fr })}
                        />
                    </div>

                    <div className="calendar-legend">
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: 'var(--success-color)' }}>
                                <FontAwesomeIcon icon={faUserMd} />
                            </div>
                            <span>Consultation</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: 'var(--danger-color)' }}>
                                <FontAwesomeIcon icon={faProcedures} />
                            </div>
                            <span>Chirurgie</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: 'var(--primary-color)' }}>
                                <FontAwesomeIcon icon={faCalendarCheck} />
                            </div>
                            <span>Autre intervention</span>
                        </div>
                    </div>
                </div>

                <div className="interventions-section">
                    <div className="section-header">
                        <h2>Interventions pour le {format(date, 'EEEE d MMMM yyyy', { locale: fr })}</h2>
                        <span className="interventions-count">{selectedInterventions.length}</span>
                    </div>

                    {selectedInterventions.length > 0 ? (
                        <div className="interventions-grid">
                            {selectedInterventions.map(intervention => (
                                <div key={intervention.id} className="intervention-card">
                                    <div className="card-header">
                                        <div className={`type-badge type-${intervention.type.toLowerCase()}`}>
                                            {intervention.type.replace(/_/g, ' ')}
                                        </div>
                                        <div className={`status-badge status-${intervention.statut.toLowerCase()}`}>
                                            {intervention.statut.toLowerCase()}
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="info-row">
                                            <span className="info-label">Salle:</span>
                                            <span className="info-value">{intervention.room?.name || 'Non attribuée'}</span>
                                        </div>
                                        {intervention.startTime && (
                                            <div className="info-row">
                                                <span className="info-label">Horaire:</span>
                                                <span className="info-value">
                                                    {format(intervention.startTime, 'HH:mm')} - {intervention.endTime ? format(intervention.endTime, 'HH:mm') : '?'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleSelectIntervention(intervention)}
                                        className="details-btn"
                                    >
                                        <span>Voir détails</span>
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-interventions">
                            <img src="/images/empty-calendar.svg" alt="Aucune intervention" />
                            <h3>Aucune intervention programmée</h3>
                            <p>Vous n'avez pas d'intervention prévue pour cette journée</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de détails */}
            {showDetails && selectedIntervention && (
                <div className="details-modal">
                    <div className="modal-content">
                        <button onClick={handleCloseDetails} className="close-modal">&times;</button>

                        <div className="modal-header">
                            <h2>
                                {selectedIntervention.type.replace(/_/g, ' ')}
                                <span className={`status-badge status-${selectedIntervention.statut.toLowerCase()}`}>
                                    {selectedIntervention.statut.toLowerCase()}
                                </span>
                            </h2>
                        </div>

                        <div className="modal-body">
                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faCalendarAlt} /> Informations générales</h3>
                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">Date:</span>
                                        <span className="detail-value">
                                            {format(selectedIntervention.date, 'EEEE d MMMM yyyy', { locale: fr })}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Horaire:</span>
                                        <span className="detail-value">
                                            {selectedIntervention.startTime ?
                                                `${format(selectedIntervention.startTime, 'HH:mm')} - ${selectedIntervention.endTime ? format(selectedIntervention.endTime, 'HH:mm') : '?'}` :
                                                'Non spécifié'}
                                        </span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">Salle:</span>
                                        <span className="detail-value">
                                            {selectedIntervention.room ? (
                                                <div className="room-details">
                                                    <span className="room-name">{selectedIntervention.room.name}</span>
                                                    {selectedIntervention.room.equipment && (
                                                        <span className="room-equipment">{selectedIntervention.room.equipment}</span>
                                                    )}
                                                </div>
                                            ) : 'Non attribuée'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faUsers} /> Équipe médicale</h3>
                                {selectedIntervention.equipeMedicale?.length > 0 ? (
                                    <div className="team-grid">
                                        {selectedIntervention.equipeMedicale.map(member => (
                                            <div key={`${member.role}-${member.id}`} className="team-member">
                                                <div className="member-role">{member.role}</div>
                                                <div className="member-info">
                                                    <FontAwesomeIcon icon={faUserCircle} />
                                                    <span className="member-name">{member.nom} {member.prenom}</span>
                                                </div>
                                                {member.telephone && (
                                                    <div className="member-contact">
                                                        <FontAwesomeIcon icon={faPhone} />
                                                        <span>{member.telephone}</span>
                                                    </div>
                                                )}
                                                {member.email && (
                                                    <div className="member-contact">
                                                        <FontAwesomeIcon icon={faEnvelope} />
                                                        <span>{member.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-team">Aucun membre assigné à cette intervention</p>
                                )}
                            </div>

                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faNotesMedical} /> Notes supplémentaires</h3>
                                <div className="notes-content">
                                    {selectedIntervention.notes || "Aucune note ajoutée"}
                                </div>
                            </div>

                            {/* Section Rapport Postopératoire */}
                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faFileMedical} /> Rapport Postopératoire</h3>
                                {rapport ? (
                                    <div className="rapport-content">
                                        <div className="rapport-field">
                                            <label>Diagnostic:</label>
                                            <div className="rapport-value">{rapport.diagnostic || 'Non renseigné'}</div>
                                        </div>
                                        <div className="rapport-field">
                                            <label>Complications:</label>
                                            <div className="rapport-value">{rapport.complications || 'Aucune complication'}</div>
                                        </div>
                                        <div className="rapport-field">
                                            <label>Recommandations:</label>
                                            <div className="rapport-value">{rapport.recommandations || 'Non renseigné'}</div>
                                        </div>
                                        <div className="rapport-field">
                                            <label>Notes Infirmier:</label>
                                            <div className="rapport-value">{rapport.notesInfirmier || 'Aucune note'}</div>
                                        </div>
                                        <div className="rapport-status">
                                            <span className={`status-badge status-${rapport.statut.toLowerCase()}`}>
                                                {rapport.statut}
                                            </span>
                                            <span className="rapport-date">
                                                Créé le {format(parseISO(rapport.dateCreation), 'dd/MM/yyyy HH:mm')}
                                            </span>
                                        </div>
                                        {rapport.statut === 'BROUILLON' && (
                                            <button
                                                onClick={handleOpenRapportForm}
                                                className="btn-edit-rapport"
                                            >
                                                Modifier le rapport
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="no-rapport">
                                        <p>Aucun rapport postopératoire n'a été créé pour cette intervention.</p>
                                        {selectedIntervention.statut === 'TERMINEE' && (
                                            <button
                                                onClick={handleOpenRapportForm}
                                                className="btn-create-rapport"
                                            >
                                                <FontAwesomeIcon icon={faPlus} /> Créer un rapport
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={() => navigate(`/intervention-details/${selectedIntervention.id}`, {
                                    state: { intervention: selectedIntervention }
                                })}
                                className="btn-more-details"
                            >
                                Voir tous les détails
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulaire de rapport postopératoire */}
            {showRapportForm && selectedIntervention && (
                <div className="rapport-form-modal">
                    <div className="modal-content">
                        <button onClick={handleCloseRapportForm} className="close-modal">&times;</button>

                        <div className="modal-header">
                            <h2>
                                <FontAwesomeIcon icon={faFileMedical} />
                                {rapport ? 'Modifier le rapport' : 'Créer un rapport postopératoire'}
                            </h2>
                        </div>

                        <div className="modal-body">
                            <form>
                                <div className="form-group">
                                    <label>Diagnostic*</label>
                                    <textarea
                                        name="diagnostic"
                                        value={rapportForm.diagnostic}
                                        onChange={handleRapportInputChange}
                                        required
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Complications</label>
                                    <textarea
                                        name="complications"
                                        value={rapportForm.complications}
                                        onChange={handleRapportInputChange}
                                        rows="2"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Recommandations*</label>
                                    <textarea
                                        name="recommandations"
                                        value={rapportForm.recommandations}
                                        onChange={handleRapportInputChange}
                                        required
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Notes Infirmier</label>
                                    <textarea
                                        name="notesInfirmier"
                                        value={rapportForm.notesInfirmier}
                                        onChange={handleRapportInputChange}
                                        rows="2"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={rapport ? handleUpdateRapport : handleCreateRapport}
                                className="btn-save-rapport"
                            >
                                <FontAwesomeIcon icon={faCheck} /> {rapport ? 'Mettre à jour' : 'Enregistrer'}
                            </button>
                            <button
                                onClick={handleCloseRapportForm}
                                className="btn-cancel-rapport"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserCalendarView;