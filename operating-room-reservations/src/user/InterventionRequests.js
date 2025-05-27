import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSpinner,
    faCheckCircle,
    faTimesCircle,
    faEye,
    faBell,
    faExclamationTriangle,
    faSave,
    faTimes,
    faUserMd,
    faSyringe,
    faUserNurse,
    faCalendarAlt,
    faClock
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { toast } from "react-toastify";
import './InterventionRequests.css';

const InterventionRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [editingRequest, setEditingRequest] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Données disponibles
    const [availableTypes, setAvailableTypes] = useState([]);
    const [availableRooms, setAvailableRooms] = useState([]);
    const [availableMaterials, setAvailableMaterials] = useState([]);
    const [availableStaff, setAvailableStaff] = useState({
        MEDECIN: [],
        ANESTHESISTE: [],
        INFIRMIER: []
    });

    // Formulaire d'édition
    const [formData, setFormData] = useState({
        type: '',
        roomId: '',
        date: '',
        startTime: '',
        endTime: '',
        materiels: [],
        equipeMedicale: {
            MEDECIN: null,
            ANESTHESISTE: null,
            INFIRMIER: null
        }
    });

    const { currentUser } = useAuth();

    // Chargement initial des données
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await currentUser.getIdToken();

                // Chargement parallèle des données
                const [requestsRes, typesRes, materialsRes, staffRes] = await Promise.all([
                    axios.get('http://localhost:8089/api/interventions/requests', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:8089/api/interventions/types', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:8089/api/materiels', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:8089/api/medical-staff', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                setRequests(requestsRes.data);
                setAvailableTypes(typesRes.data);
                setAvailableMaterials(materialsRes.data);

                // Organiser le staff par rôle
                const staffByRole = { MEDECIN: [], ANESTHESISTE: [], INFIRMIER: [] };
                staffRes.data.forEach(staff => {
                    if (staff.role && staffByRole[staff.role]) {
                        staffByRole[staff.role].push(staff);
                    }
                });
                setAvailableStaff(staffByRole);

            } catch (err) {
                setError(err.response?.data?.message || err.message);
                toast.error("Erreur lors du chargement des données");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

    // Charger les salles disponibles quand le type ou les heures changent
    useEffect(() => {
        if (formData.type && formData.date) {
            const fetchRooms = async () => {
                try {
                    const token = await currentUser.getIdToken();
                    const response = await axios.get(
                        'http://localhost:8089/api/interventions/available-rooms',
                        {
                            params: {
                                type: formData.type,
                                startTime: formData.startTime
                                    ? `${formData.date}T${formData.startTime}:00`
                                    : `${formData.date}T00:00:00`,
                                endTime: formData.endTime
                                    ? `${formData.date}T${formData.endTime}:00`
                                    : `${formData.date}T23:59:59`
                            },
                            headers: { 'Authorization': `Bearer ${token}` }
                        }
                    );
                    setAvailableRooms(response.data);
                } catch (err) {
                    toast.error("Erreur lors du chargement des salles disponibles");
                }
            };

            fetchRooms();
        }
    }, [formData.type, formData.date, formData.startTime, formData.endTime, currentUser]);

    // Gestion des formulaires
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStaffSelection = (role, staffId) => {
        setFormData(prev => ({
            ...prev,
            equipeMedicale: {
                ...prev.equipeMedicale,
                [role]: staffId ? parseInt(staffId) : null
            }
        }));
    };

    const handleMaterialSelection = (materialId, isChecked) => {
        setFormData(prev => ({
            ...prev,
            materiels: isChecked
                ? [...prev.materiels, materialId]
                : prev.materiels.filter(id => id !== materialId)
        }));
    };

    // Édition d'une demande
    const handleEditClick = (request) => {
        setEditingRequest(request);
        setFormData({
            type: request.type,
            roomId: request.roomId || '',
            date: request.date ? request.date.split('T')[0] : '',
            startTime: request.startTime ? request.startTime.split('T')[1].substring(0, 5) : '',
            endTime: request.endTime ? request.endTime.split('T')[1].substring(0, 5) : '',
            materiels: request.materiels?.map(m => m.id) || [],
            equipeMedicale: {
                MEDECIN: request.equipeMedicale?.find(s => s.role === 'MEDECIN')?.id || null,
                ANESTHESISTE: request.equipeMedicale?.find(s => s.role === 'ANESTHESISTE')?.id || null,
                INFIRMIER: request.equipeMedicale?.find(s => s.role === 'INFIRMIER')?.id || null
            }
        });
        setValidationErrors({});
    };

    const handleCancelEdit = () => {
        setEditingRequest(null);
        setFormData({
            type: '',
            roomId: '',
            date: '',
            startTime: '',
            endTime: '',
            materiels: [],
            equipeMedicale: {
                MEDECIN: null,
                ANESTHESISTE: null,
                INFIRMIER: null
            }
        });
        setValidationErrors({});
    };

    // Validation du formulaire
    const validateForm = () => {
        const errors = {};
        const today = new Date().toISOString().split('T')[0];

        if (!formData.type) errors.type = "Type d'intervention requis";
        if (!formData.roomId) errors.roomId = "Salle requise";
        if (!formData.date) errors.date = "Date requise";

        if (formData.startTime && formData.endTime) {
            const start = new Date(`${formData.date}T${formData.startTime}`);
            const end = new Date(`${formData.date}T${formData.endTime}`);

            if (start >= end) {
                errors.time = "L'heure de fin doit être après l'heure de début";
            }
        }

        if (formData.materiels.length === 0) errors.materiels = "Au moins un matériel requis";
        if (!formData.equipeMedicale.MEDECIN) errors.medecin = "Médecin requis";
        if (!formData.equipeMedicale.ANESTHESISTE) errors.anesthesiste = "Anesthésiste requis";
        if (!formData.equipeMedicale.INFIRMIER) errors.infirmier = "Infirmier requis";

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    };

    // Soumission du formulaire
    const handleApprove = async (interventionId) => {
        // Validation
        const validation = validateForm();
        if (!validation.isValid) {
            setValidationErrors(prev => ({
                ...prev,
                [interventionId]: validation.errors
            }));
            toast.error("Veuillez corriger les erreurs dans le formulaire");
            return;
        }

        setSubmitting(true);
        try {
            const token = await currentUser.getIdToken();
            const originalRequest = requests.find(req => req.id === interventionId);

            // Préparation des dates correctement formatées
            const startDateTime = formData.startTime
                ? `${formData.date}T${formData.startTime}:00`
                : null;
            const endDateTime = formData.endTime
                ? `${formData.date}T${formData.endTime}:00`
                : null;

            // Préparation du payload selon InterventionValidationDTO
            const payload = {
                type: formData.type,
                roomId: parseInt(formData.roomId),
                date: formData.date,
                startTime: startDateTime,
                endTime: endDateTime,
                materielIds: formData.materiels,
                equipeMedicale: {
                    MEDECIN: formData.equipeMedicale.MEDECIN,
                    ANESTHESISTE: formData.equipeMedicale.ANESTHESISTE,
                    INFIRMIER: formData.equipeMedicale.INFIRMIER
                },
                statut: 'PLANIFIEE'
            };

            // Valider et modifier l'intervention
            const response = await axios.put(
                `http://localhost:8089/api/interventions/demandes/${interventionId}/valider-et-modifier`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Mise à jour de l'état local avec la réponse du serveur
            setRequests(prev =>
                prev.map(req =>
                    req.id === interventionId ? {
                        ...response.data,
                        description: originalRequest.description,
                        urgencyLevel: originalRequest.urgencyLevel,
                        doctor: originalRequest.doctor
                    } : req
                )
            );

            // Réinitialisation du formulaire
            setEditingRequest(null);
            setFormData({
                type: '',
                roomId: '',
                date: '',
                startTime: '',
                endTime: '',
                materiels: [],
                equipeMedicale: {
                    MEDECIN: null,
                    ANESTHESISTE: null,
                    INFIRMIER: null
                }
            });
            setValidationErrors({});

            toast.success("Intervention validée et modifiée avec succès!");

        } catch (err) {
            console.error("Erreur lors de la validation de l'intervention:", err);
            if (err.response?.data) {
                setValidationErrors(prev => ({
                    ...prev,
                    [interventionId]: typeof err.response.data === 'string'
                        ? { general: err.response.data }
                        : err.response.data
                }));
            }
            toast.error(err.response?.data?.message || "Erreur lors de la validation de l'intervention");
        } finally {
            setSubmitting(false);
        }
    };
    // Rejet d'une demande
    const handleReject = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette demande ?")) return;

        try {
            setSubmitting(true);
            const token = await currentUser.getIdToken();

            // Appel API pour suppression
            await axios.delete(
                `http://localhost:8089/api/interventions/${id}/reject`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            // Mise à jour optimiste de l'état local
            setRequests(prev => prev.filter(req => req.id !== id));

            toast.success("Demande supprimée définitivement");

        } catch (err) {
            console.error("Erreur:", err);
            toast.error(err.response?.data?.message || "Échec de la suppression");
        } finally {
            setSubmitting(false);
        }
    };
    // Composant pour afficher les erreurs de validation
    const ValidationMessages = ({ errors }) => {
        if (!errors || Object.keys(errors).length === 0) return null;

        return (
            <div className="validation-messages">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <ul>
                    {Object.entries(errors).map(([field, message]) => (
                        <li key={field}>{message}</li>
                    ))}
                </ul>
            </div>
        );
    };

    // Composant pour la sélection du staff
    const StaffSelection = ({ role, label, icon }) => {
        return (
            <div className="staff-section">
                <h5>
                    <FontAwesomeIcon icon={icon} /> {label}
                </h5>
                <div className="staff-radio-group">
                    {availableStaff[role]?.map(staff => (
                        <div key={staff.id} className={`staff-radio-item ${formData.equipeMedicale[role] === staff.id ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                id={`${role}-${staff.id}`}
                                name={role}
                                checked={formData.equipeMedicale[role] === staff.id}
                                onChange={() => handleStaffSelection(role, staff.id)}
                            />
                            <label htmlFor={`${role}-${staff.id}`}>
                                <div className="staff-name">{staff.firstName} {staff.lastName}</div>
                                {staff.specialty && <div className="staff-specialty">{staff.specialty}</div>}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <FontAwesomeIcon icon={faSpinner} spin size="2x" />
                <p>Chargement des demandes...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-alert">
                    <h3>Erreur</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="intervention-requests-container">
            <h2><FontAwesomeIcon icon={faBell} /> Demandes d'intervention</h2>

            {requests.length === 0 ? (
                <div className="no-requests">
                    <p>Aucune demande d'intervention en attente</p>
                </div>
            ) : (
                <div className="requests-table-container">
                    <table className="requests-table">
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th>Médecin</th>
                            <th>Type</th>
                            <th>Date demandée</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {requests.map(request => (
                            <React.Fragment key={request.id}>
                                <tr>
                                    <td>{request.id}</td>
                                    <td>{request.doctor?.firstName} {request.doctor?.lastName}</td>
                                    <td>{request.type}</td>
                                    <td>
                                        {request.date && new Date(request.date).toLocaleDateString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td>
                                            <span className={`status-badge ${request.statut.toLowerCase()}`}>
                                                {request.statut}
                                            </span>
                                    </td>
                                    <td className="actions-cell">
                                        {request.statut === 'DEMANDE' && (
                                            <>
                                                <button
                                                    className="btn-edit"
                                                    onClick={() => handleEditClick(request)}
                                                    disabled={submitting}
                                                >
                                                    <FontAwesomeIcon icon={faCheckCircle} /> Planifier
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => handleReject(request.id)}
                                                    disabled={submitting}
                                                >
                                                    <FontAwesomeIcon icon={faTimesCircle} /> Rejeter
                                                </button>
                                            </>
                                        )}

                                    </td>
                                </tr>

                                {editingRequest?.id === request.id && (
                                    <tr className="edit-form-row">
                                        <td colSpan="6">
                                            <div className="edit-form-container">
                                                <h4>Planifier l'intervention #{request.id}</h4>

                                                {validationErrors[request.id] && (
                                                    <ValidationMessages errors={validationErrors[request.id]} />
                                                )}

                                                <div className="form-grid">
                                                    <div className="form-group">
                                                        <label>Type d'intervention:</label>
                                                        <select
                                                            name="type"
                                                            value={formData.type}
                                                            onChange={handleFormChange}
                                                            className="form-control"
                                                        >
                                                            <option value="">Sélectionnez un type</option>
                                                            {availableTypes.map(type => (
                                                                <option key={type} value={type}>
                                                                    {type.replace(/_/g, ' ')}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>Salle:</label>
                                                        <select
                                                            name="roomId"
                                                            value={formData.roomId}
                                                            onChange={handleFormChange}
                                                            className="form-control"
                                                            disabled={!formData.type}
                                                        >
                                                            <option value="">{formData.type ? 'Sélectionnez une salle' : 'Sélectionnez d\'abord un type'}</option>
                                                            {availableRooms.map(room => (
                                                                <option key={room.id} value={room.id}>
                                                                    {room.name} ({room.type})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="form-group">
                                                        <label>
                                                            <FontAwesomeIcon icon={faCalendarAlt} /> Date:
                                                        </label>
                                                        <input
                                                            type="date"
                                                            name="date"
                                                            value={formData.date}
                                                            onChange={handleFormChange}
                                                            className="form-control"
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label>
                                                            <FontAwesomeIcon icon={faClock} /> Heure de début:
                                                        </label>
                                                        <input
                                                            type="time"
                                                            name="startTime"
                                                            value={formData.startTime}
                                                            onChange={handleFormChange}
                                                            className="form-control"
                                                        />
                                                    </div>

                                                    <div className="form-group">
                                                        <label>
                                                            <FontAwesomeIcon icon={faClock} /> Heure de fin:
                                                        </label>
                                                        <input
                                                            type="time"
                                                            name="endTime"
                                                            value={formData.endTime}
                                                            onChange={handleFormChange}
                                                            className="form-control"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-section">
                                                    <h5>Équipe Médicale</h5>
                                                    <StaffSelection
                                                        role="MEDECIN"
                                                        label="Médecin"
                                                        icon={faUserMd}
                                                    />
                                                    <StaffSelection
                                                        role="ANESTHESISTE"
                                                        label="Anesthésiste"
                                                        icon={faSyringe}
                                                    />
                                                    <StaffSelection
                                                        role="INFIRMIER"
                                                        label="Infirmier"
                                                        icon={faUserNurse}
                                                    />
                                                </div>

                                                <div className="form-section">
                                                    <h5>Matériels nécessaires</h5>
                                                    <div className="materials-container">
                                                        <div className="materials-checkbox-list">
                                                            {availableMaterials.map(material => (
                                                                <div
                                                                    key={material.id}
                                                                    className={`material-checkbox-item ${material.quantiteDisponible <= 0 ? 'unavailable' : ''}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`material-${material.id}`}
                                                                        checked={formData.materiels.includes(material.id)}
                                                                        onChange={(e) => handleMaterialSelection(material.id, e.target.checked)}
                                                                        disabled={material.quantiteDisponible <= 0 && !formData.materiels.includes(material.id)}
                                                                    />
                                                                    <label htmlFor={`material-${material.id}`}>
                                                                        {material.nom} - {material.description}
                                                                        <span className={`quantity ${material.quantiteDisponible <= 0 ? 'unavailable' : 'available'}`}>
                                                                                ({material.quantiteDisponible} disponible{material.quantiteDisponible > 1 ? 's' : ''})
                                                                            </span>
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="selected-materials">
                                                            {formData.materiels.length > 0 ? (
                                                                formData.materiels.map(id => {
                                                                    const material = availableMaterials.find(m => m.id === id);
                                                                    return material ? (
                                                                        <span key={id} className="material-tag">
                                                                                {material.nom}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleMaterialSelection(id, false)}
                                                                                className="remove-material"
                                                                            >
                                                                                    ×
                                                                                </button>
                                                                            </span>
                                                                    ) : null;
                                                                })
                                                            ) : (
                                                                <p className="no-materials">Aucun matériel sélectionné</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="form-actions">
                                                    <button
                                                        className="btn-save"
                                                        onClick={() => handleApprove(request.id)}
                                                        disabled={submitting}
                                                    >
                                                        {submitting ? (
                                                            <FontAwesomeIcon icon={faSpinner} spin />
                                                        ) : (
                                                            <>
                                                                <FontAwesomeIcon icon={faSave} /> Confirmer la planification
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={handleCancelEdit}
                                                        disabled={submitting}
                                                    >
                                                        <FontAwesomeIcon icon={faTimes} /> Annuler
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default InterventionRequests;
