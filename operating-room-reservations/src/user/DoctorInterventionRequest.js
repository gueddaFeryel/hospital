import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faCalendarAlt,
    faClock,
    faExclamationTriangle,
    faCheckCircle,
    faSpinner,
    faStethoscope,
    faUserMd,
    faSyringe,
    faUserNurse
} from '@fortawesome/free-solid-svg-icons';
import './DoctorInterventionRequest.css';

const DoctorInterventionRequest = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [formData, setFormData] = useState({
        date: '',
        type: '',
        statut: 'DEMANDE',
        startTime: '',
        endTime: '',
        description: '',
        urgencyLevel: 'NORMAL'
    });

    const [loading, setLoading] = useState(false);
    const [doctorLoading, setDoctorLoading] = useState(true);
    const [error, setError] = useState(null);
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [interventionTypes, setInterventionTypes] = useState([]);
    const [medicalStaff, setMedicalStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: []
    });
    const [filteredMedicalStaff, setFilteredMedicalStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: []
    });
    const [selectedStaff, setSelectedStaff] = useState({
        MEDECIN: null,
        ANESTHESISTE: null,
        INFIRMIER: null
    });
    const [loadingStaff, setLoadingStaff] = useState(false);

    // Fonction pour obtenir les spécialités compatibles
    const getCompatibleSpecialities = (interventionType) => {
        const typeToSpecialities = {
            CHIRURGIE_CARDIAQUE: {
                MEDECIN: ['CARDIOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_CARDIOTHORACIQUE'],
                INFIRMIER: []
            },
            ORTHOPEDIQUE: {
                MEDECIN: ['ORTHOPEDIE', 'TRAUMATOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_ORTHOPEDIQUE'],
                INFIRMIER: []
            },
            NEUROCHIRURGIE: {
                MEDECIN: ['NEUROLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_NEUROCHIRURGICALE'],
                INFIRMIER: []
            },
            OPHTALMOLOGIQUE: {
                MEDECIN: ['OPHTALMOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            },
            UROLOGIE: {
                MEDECIN: ['UROLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            },
            GYNECOLOGIQUE: {
                MEDECIN: ['GYNECOLOGIE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            },
            AUTRE: {
                MEDECIN: ['CHIRURGIE_GENERALE', 'AUTRE'],
                ANESTHESISTE: ['ANESTHESIE_GENERALE'],
                INFIRMIER: []
            }
        };

        return typeToSpecialities[interventionType] || {
            MEDECIN: [],
            ANESTHESISTE: [],
            INFIRMIER: []
        };
    };

    // Fonction pour vérifier la compatibilité d'un membre du personnel
    const isStaffCompatible = (staff, role, interventionType) => {
        if (role === 'INFIRMIER') return true;

        const compatibleSpecialities = getCompatibleSpecialities(interventionType)[role] || [];
        if (role === 'MEDECIN') {
            return compatibleSpecialities.includes(staff.specialiteMedecin);
        } else if (role === 'ANESTHESISTE') {
            return compatibleSpecialities.includes(staff.specialiteAnesthesiste);
        }

        return false;
    };

    useEffect(() => {
        const fetchDoctorInfo = async () => {
            try {
                if (!currentUser?.uid) {
                    throw new Error("User not authenticated");
                }

                const response = await axios.get(
                    `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
                );

                if (!response.data?.id) {
                    throw new Error("Doctor ID not found");
                }

                setDoctorInfo(response.data);
            } catch (err) {
                console.error("Error fetching doctor info:", err);
                setError(err.response?.data?.message || err.message || "Erreur lors de la récupération des informations du médecin");
            } finally {
                setDoctorLoading(false);
            }
        };

        const fetchInterventionTypes = async () => {
            try {
                const response = await axios.get('http://localhost:8089/api/interventions/types');
                setInterventionTypes(response.data);
            } catch (err) {
                console.error("Failed to fetch intervention types", err);
                setError(prev => prev || "Erreur lors de la récupération des types d'intervention");
            }
        };

        fetchDoctorInfo();
        fetchInterventionTypes();
    }, [currentUser]);

    useEffect(() => {
        const fetchMedicalStaff = async () => {
            if (!formData.type) return;

            setLoadingStaff(true);
            try {
                const [medecins, anesthesistes, infirmiers] = await Promise.all([
                    axios.get('http://localhost:8089/api/medical-staff/by-role/MEDECIN'),
                    axios.get('http://localhost:8089/api/medical-staff/by-role/ANESTHESISTE'),
                    axios.get('http://localhost:8089/api/medical-staff/by-role/INFIRMIER')
                ]);

                const medicalStaffData = {
                    MEDECIN: medecins.data,
                    ANESTHESISTE: anesthesistes.data,
                    INFIRMIER: infirmiers.data
                };

                console.log('Medical Staff Data:', medicalStaffData);
                setMedicalStaff(medicalStaffData);
            } catch (err) {
                console.error("Error fetching medical staff:", err);
                setError("Erreur lors du chargement du personnel médical");
            } finally {
                setLoadingStaff(false);
            }
        };

        fetchMedicalStaff();
    }, [formData.type]);

    // Filtrer le personnel médical en fonction du type d'intervention
    useEffect(() => {
        if (!formData.type) {
            setFilteredMedicalStaff({
                MEDECIN: [],
                ANESTHESISTE: [],
                INFIRMIER: medicalStaff.INFIRMIER // Pas de filtrage pour les infirmiers
            });
            return;
        }

        const filteredStaff = {
            MEDECIN: medicalStaff.MEDECIN.filter(staff =>
                isStaffCompatible(staff, 'MEDECIN', formData.type)
            ),
            ANESTHESISTE: medicalStaff.ANESTHESISTE.filter(staff =>
                isStaffCompatible(staff, 'ANESTHESISTE', formData.type)
            ),
            INFIRMIER: medicalStaff.INFIRMIER // Pas de filtrage pour les infirmiers
        };

        console.log('Filtered Medical Staff:', filteredStaff);
        setFilteredMedicalStaff(filteredStaff);

        // Réinitialiser la sélection si le personnel précédemment sélectionné n'est plus compatible
        setSelectedStaff(prev => ({
            MEDECIN: prev.MEDECIN && filteredStaff.MEDECIN.some(staff => staff.id === prev.MEDECIN)
                ? prev.MEDECIN
                : null,
            ANESTHESISTE: prev.ANESTHESISTE && filteredStaff.ANESTHESISTE.some(staff => staff.id === prev.ANESTHESISTE)
                ? prev.ANESTHESISTE
                : null,
            INFIRMIER: prev.INFIRMIER
        }));
    }, [formData.type, medicalStaff]);

    const validateForm = () => {
        const errors = {};
        const today = new Date().toISOString().split('T')[0];

        if (!formData.date) {
            errors.date = "La date est requise";
        } else if (formData.date < today) {
            errors.date = "Vous ne pouvez pas créer une intervention dans le passé";
        }

        if (!formData.type) {
            errors.type = "Le type est requis";
        }

        if (!formData.description) {
            errors.description = "Veuillez fournir une description de l'intervention";
        }

        if (formData.startTime && formData.endTime) {
            const start = new Date(`${formData.date}T${formData.startTime}`);
            const end = new Date(`${formData.date}T${formData.endTime}`);

            if (start >= end) {
                errors.time = "L'heure de fin doit être après l'heure de début";
            }

            const durationHours = (end - start) / (1000 * 60 * 60);
            if (durationHours > 24) {
                errors.time = "La durée ne doit pas dépasser 24 heures";
            }
        }

        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStaffChange = (role, staffId) => {
        setSelectedStaff(prev => ({
            ...prev,
            [role]: staffId ? parseInt(staffId) : null
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setError(Object.values(errors).join(", "));
            setLoading(false);
            return;
        }

        try {
            if (!doctorInfo?.id) {
                throw new Error("Doctor ID not available");
            }

            const equipeMedicale = {};
            Object.entries(selectedStaff).forEach(([role, staffId]) => {
                if (staffId !== null) {
                    equipeMedicale[role] = staffId;
                }
            });

            const payload = {
                date: formData.date,
                type: formData.type,
                statut: 'DEMANDE',
                doctorId: doctorInfo.id,
                startTime: formData.startTime ? `${formData.date}T${formData.startTime}:00` : null,
                endTime: formData.endTime ? `${formData.date}T${formData.endTime}:00` : null,
                description: formData.description,
                urgencyLevel: formData.urgencyLevel,
                equipeMedicale: equipeMedicale
            };

            const response = await axios.post(
                'http://localhost:8089/api/interventions/with-room-and-user',
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Current-User-ID': doctorInfo.id
                    }
                }
            );

            setSuccessMessage("Demande envoyée avec succès! Une notification a été envoyée à l'administrateur.");

            setTimeout(() => {
                setFormData({
                    date: '',
                    type: '',
                    statut: 'DEMANDE',
                    startTime: '',
                    endTime: '',
                    description: '',
                    urgencyLevel: 'NORMAL'
                });
                setSelectedStaff({
                    MEDECIN: null,
                    ANESTHESISTE: null,
                    INFIRMIER: null
                });
                setSuccessMessage(null);
                navigate('/doctor-interventions');
            }, 3000);

        } catch (err) {
            let errorMessage = 'Erreur lors de la soumission';
            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = "Votre session a expiré, veuillez vous reconnecter";
                    navigate('/login');
                } else if (err.response.data && err.response.data.errors) {
                    errorMessage = Object.values(err.response.data.errors).join(", ");
                } else {
                    errorMessage = err.response.data?.message || err.response.data;
                }
            } else {
                errorMessage = err.message || errorMessage;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Fonction utilitaire pour formater le nom d'un membre du staff
    const formatStaffName = (staff, role) => {
        if (!staff || typeof staff !== 'object') {
            console.warn(`Staff object is invalid for role ${role}:`, staff);
            return 'Données non disponibles';
        }

        const prenom = staff.prenom && staff.prenom.trim() ? staff.prenom : 'Prénom inconnu';
        const nom = staff.nom && staff.nom.trim() ? staff.nom : 'Nom inconnu';
        const name = `${prenom} ${nom}`;

        console.log(`Formatting staff for role ${role}:`, {
            id: staff.id,
            prenom: staff.prenom,
            nom: staff.nom,
            specialiteMedecin: staff.specialiteMedecin,
            specialiteAnesthesiste: staff.specialiteAnesthesiste
        });

        if (role === 'INFIRMIER') {
            return name;
        }

        const specialty = role === 'MEDECIN' && staff.specialiteMedecin
            ? ` (${staff.specialiteMedecin})`
            : role === 'ANESTHESISTE' && staff.specialiteAnesthesiste
                ? ` (${staff.specialiteAnesthesiste})`
                : '';
        return `${name}${specialty}`;
    };

    if (doctorLoading) {
        return (
            <div className="loading-container">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Chargement des informations du médecin...</p>
            </div>
        );
    }

    if (error && !doctorInfo) {
        return (
            <div className="error-container">
                <div className="error-alert">
                    <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                    <h3>Erreur</h3>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="intervention-form-container">
            <div className="form-header">
                <h2>
                    <FontAwesomeIcon icon={faStethoscope} /> Demande d'Intervention
                </h2>
                <Link to="/doctor-dashboard" className="btn btn-back">
                    <FontAwesomeIcon icon={faArrowLeft} /> Retour au tableau de bord
                </Link>
            </div>

            {error && (
                <div className="alert alert-error">
                    <FontAwesomeIcon icon={faExclamationTriangle} />
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="alert alert-success">
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>{successMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="intervention-form">
                <div className="form-grid">
                    <div className="form-group">
                        <label>
                            <FontAwesomeIcon icon={faCalendarAlt} /> Date:
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            className="form-control"
                        />
                    </div>

                    <div className="form-group">
                        <label>Type d'intervention:</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            required
                            className="form-control"
                        >
                            <option value="">Sélectionner un type</option>
                            {interventionTypes.map((type) => (
                                <option key={type} value={type}>
                                    {type.replace(/_/g, ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Niveau d'urgence:</label>
                        <select
                            name="urgencyLevel"
                            value={formData.urgencyLevel}
                            onChange={handleChange}
                            className="form-control"
                        >
                            <option value="FAIBLE">Faible</option>
                            <option value="NORMAL">Normal</option>
                            <option value="ELEVEE">Élevée</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>

                    <div className="form-group time-group">
                        <label>
                            <FontAwesomeIcon icon={faClock} /> Heure de début (optionnel):
                        </label>
                        <input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group time-group">
                        <label>
                            <FontAwesomeIcon icon={faClock} /> Heure de fin (optionnel):
                        </label>
                        <input
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            className="form-control"
                        />
                    </div>

                    <div className="form-group full-width">
                        <label>Description détaillée:</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            className="form-control"
                            rows="5"
                            placeholder="Décrivez en détail l'intervention demandée, les besoins spécifiques, etc."
                        />
                    </div>

                    <div className="form-group full-width">
                        <h3>
                            <FontAwesomeIcon icon={faUserMd} /> Équipe Médicale
                        </h3>

                        <div className="staff-selection">
                            <div className="staff-role-group">
                                <label>
                                    <FontAwesomeIcon icon={faUserMd} /> Médecin:
                                </label>
                                <select
                                    value={selectedStaff.MEDECIN || ''}
                                    onChange={(e) => handleStaffChange('MEDECIN', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">Sélectionner un médecin</option>
                                    {filteredMedicalStaff.MEDECIN?.length > 0 ? (
                                        filteredMedicalStaff.MEDECIN.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {formatStaffName(staff, 'MEDECIN')}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Aucun médecin compatible disponible</option>
                                    )}
                                </select>
                            </div>

                            <div className="staff-role-group">
                                <label>
                                    <FontAwesomeIcon icon={faSyringe} /> Anesthésiste:
                                </label>
                                <select
                                    value={selectedStaff.ANESTHESISTE || ''}
                                    onChange={(e) => handleStaffChange('ANESTHESISTE', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">Sélectionner un anesthésiste</option>
                                    {filteredMedicalStaff.ANESTHESISTE?.length > 0 ? (
                                        filteredMedicalStaff.ANESTHESISTE.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {formatStaffName(staff, 'ANESTHESISTE')}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Aucun anesthésiste compatible disponible</option>
                                    )}
                                </select>
                            </div>

                            <div className="staff-role-group">
                                <label>
                                    <FontAwesomeIcon icon={faUserNurse} /> Infirmier:
                                </label>
                                <select
                                    value={selectedStaff.INFIRMIER || ''}
                                    onChange={(e) => handleStaffChange('INFIRMIER', e.target.value)}
                                    className="form-control"
                                >
                                    <option value="">Sélectionner un infirmier</option>
                                    {filteredMedicalStaff.INFIRMIER?.length > 0 ? (
                                        filteredMedicalStaff.INFIRMIER.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {formatStaffName(staff, 'INFIRMIER')}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Aucun infirmier disponible</option>
                                    )}
                                </select>
                            </div>
                        </div>

                        {loadingStaff && (
                            <div className="loading-indicator">
                                <FontAwesomeIcon icon={faSpinner} spin /> Chargement du personnel...
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-submit"
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                <span>Envoi en cours...</span>
                            </>
                        ) : (
                            'Envoyer la demande'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/doctor-dashboard')}
                        className="btn btn-cancel"
                    >
                        Annuler
                    </button>
                </div>
            </form>

            <div className="doctor-info-card">
                <h3>Informations du médecin</h3>
                {doctorInfo && (
                    <div className="info-content">
                        <p><strong>Nom:</strong> {doctorInfo.nom} {doctorInfo.prenom}</p>
                        <p><strong>Spécialité:</strong> {doctorInfo.specialiteMedecin || 'Non spécifiée'}</p>
                        <p><strong>ID:</strong> {doctorInfo.id}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DoctorInterventionRequest;
