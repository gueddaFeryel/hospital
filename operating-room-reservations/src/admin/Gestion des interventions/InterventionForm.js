import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../Gestion des interventions css/InterventionForm.css';

const InterventionForm = ({ editMode }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        date: '',
        type: '',
        statut: 'PLANIFIEE',
        startTime: '',
        endTime: '',
        roomId: null
    });

    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [roomLoading, setRoomLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [formSubmitted, setFormSubmitted] = useState(false);

    // Constantes pour les durées
    const MIN_DURATION_MINUTES = 30;
    const MAX_DURATION_HOURS = 12;

    const interventionTypes = [
        { value: 'CHIRURGIE_CARDIAQUE', label: 'Chirurgie cardiaque' },
        { value: 'ORTHOPEDIQUE', label: 'Orthopédique' },
        { value: 'NEUROCHIRURGIE', label: 'Neurochirurgie' },
        { value: 'OPHTALMOLOGIQUE', label: 'Ophtalmologique' },
        { value: 'UROLOGIE', label: 'Urologie' },
        { value: 'GYNECOLOGIQUE', label: 'Gynécologique' },
        { value: 'AUTRE', label: 'Autre' }
    ];

    const statusOptions = [
        { value: 'PLANIFIEE', label: 'Planifiée' },
        { value: 'EN_COURS', label: 'En cours' },
        { value: 'TERMINEE', label: 'Terminée' },
        { value: 'ANNULEE', label: 'Annulée' }
    ];

    useEffect(() => {
        if (editMode && id) {
            const fetchIntervention = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(`http://localhost:8089/api/interventions/${id}`);
                    const data = response.data;

                    setFormData({
                        ...data,
                        date: data.date.split('T')[0],
                        startTime: data.startTime ? data.startTime.split('T')[1].substring(0, 5) : '',
                        endTime: data.endTime ? data.endTime.split('T')[1].substring(0, 5) : '',
                        statut: data.statut || 'PLANIFIEE',
                        roomId: data.roomId || null
                    });

                    if (data.roomId) {
                        try {
                            const roomResponse = await axios.get(`http://localhost:8086/api/rooms/${data.roomId}`);
                            setSelectedRoom(roomResponse.data);
                        } catch (e) {
                            console.error("Erreur récupération salle:", e);
                            setSelectedRoom({
                                id: data.roomId,
                                name: `Salle ${data.roomId}`,
                                equipment: 'Non disponible'
                            });
                        }
                    }
                } catch (err) {
                    setErrors({ form: err.response?.data?.message || err.message });
                } finally {
                    setLoading(false);
                }
            };
            fetchIntervention();
        }
    }, [editMode, id]);

    const validateField = (name, value) => {
        const newErrors = { ...errors };
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        switch (name) {
            case 'date':
                if (!value) {
                    newErrors.date = "La date est requise";
                } else if (value < today) {
                    newErrors.date = "Vous ne pouvez pas créer une intervention dans le passé";
                } else {
                    delete newErrors.date;
                }
                break;

            case 'type':
                if (!value) {
                    newErrors.type = "Le type d'intervention est requis";
                } else {
                    delete newErrors.type;
                }
                break;

            case 'startTime':
            case 'endTime':
                if (formData.startTime && formData.endTime) {
                    const start = new Date(`${formData.date}T${formData.startTime}`);
                    const end = new Date(`${formData.date}T${formData.endTime}`);

                    // Vérification si la date est aujourd'hui et l'heure est passée
                    if (formData.date === today) {
                        if (start < now) {
                            newErrors.time = "L'heure de début ne peut pas être dans le passé";
                        } else if (end < now) {
                            newErrors.time = "L'heure de fin ne peut pas être dans le passé";
                        }
                    }

                    if (start >= end) {
                        newErrors.time = "L'heure de fin doit être après l'heure de début";
                    } else {
                        // Vérification de la durée
                        const durationMinutes = (end - start) / (1000 * 60);

                        if (durationMinutes < MIN_DURATION_MINUTES) {
                            newErrors.time = `La durée minimale est de ${MIN_DURATION_MINUTES} minutes`;
                        } else if (durationMinutes > (MAX_DURATION_HOURS * 60)) {
                            newErrors.time = `La durée maximale est de ${MAX_DURATION_HOURS} heures`;
                        } else {
                            delete newErrors.time;
                        }
                    }
                }
                break;

            default:
                break;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validation en temps réel après la première soumission
        if (formSubmitted) {
            validateField(name, value);
        }
    };

    const checkInterventionConflict = async () => {
        if (!formData.date || !formData.startTime || !formData.endTime || !selectedRoom?.id) {
            return false;
        }

        try {
            const response = await axios.get('http://localhost:8089/api/interventions/check-conflict', {
                params: {
                    roomId: selectedRoom.id,
                    startTime: `${formData.date}T${formData.startTime}:00`,
                    endTime: `${formData.date}T${formData.endTime}:00`,
                    interventionId: editMode ? id : null
                }
            });

            return response.data.hasConflict;
        } catch (err) {
            console.error('Erreur vérification conflit:', err);
            return false;
        }
    };

    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        const selected = availableRooms.find(r => r.id.toString() === roomId);
        setSelectedRoom(selected || null);
        setFormData(prev => ({ ...prev, roomId: selected ? selected.id : null }));
    };

    const fetchAvailableRooms = async () => {
        try {
            if (!formData.type) {
                setErrors({ type: "Veuillez sélectionner un type d'intervention" });
                return;
            }

            if (!formData.date) {
                setErrors({ date: "Veuillez sélectionner une date" });
                return;
            }

            if (!formData.startTime || !formData.endTime) {
                setErrors({ time: "Veuillez spécifier les heures de début et fin" });
                return;
            }

            setRoomLoading(true);
            setErrors({});

            const startDateTime = `${formData.date}T${formData.startTime}:00`;
            const endDateTime = `${formData.date}T${formData.endTime}:00`;

            const response = await axios.get('http://localhost:8089/api/interventions/available-rooms', {
                params: {
                    startTime: startDateTime,
                    endTime: endDateTime,
                    type: formData.type
                }
            });

            setAvailableRooms(response.data || []);
            if (response.data.length === 0) {
                setErrors({ rooms: "Aucune salle disponible pour ces critères" });
            }
        } catch (err) {
            setErrors({ rooms: err.response?.data?.message || "Erreur lors de la recherche des salles" });
            console.error('Error fetching rooms:', err);
        } finally {
            setRoomLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        if (!formData.date) {
            newErrors.date = "La date est requise";
        } else if (formData.date < today) {
            newErrors.date = "Vous ne pouvez pas créer une intervention dans le passé";
        }

        if (!formData.type) {
            newErrors.type = "Le type d'intervention est requis";
        }

        if (!formData.startTime) {
            newErrors.time = "L'heure de début est requise";
        }

        if (!formData.endTime) {
            newErrors.time = "L'heure de fin est requise";
        }

        if (formData.startTime && formData.endTime) {
            const start = new Date(`${formData.date}T${formData.startTime}`);
            const end = new Date(`${formData.date}T${formData.endTime}`);

            // Vérification si la date est aujourd'hui et l'heure est passée
            if (formData.date === today) {
                if (start < now) {
                    newErrors.time = "L'heure de début ne peut pas être dans le passé";
                } else if (end < now) {
                    newErrors.time = "L'heure de fin ne peut pas être dans le passé";
                }
            }

            if (start >= end) {
                newErrors.time = "L'heure de fin doit être après l'heure de début";
            } else {
                // Vérification de la durée
                const durationMinutes = (end - start) / (1000 * 60);

                if (durationMinutes < MIN_DURATION_MINUTES) {
                    newErrors.time = `La durée minimale est de ${MIN_DURATION_MINUTES} minutes`;
                } else if (durationMinutes > (MAX_DURATION_HOURS * 60)) {
                    newErrors.time = `La durée maximale est de ${MAX_DURATION_HOURS} heures`;
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        if (!validateForm()) {
            return;
        }

        // Vérifier les conflits seulement si une salle est sélectionnée
        if (selectedRoom?.id) {
            const hasConflict = await checkInterventionConflict();
            if (hasConflict) {
                setErrors({
                    form: 'Cette salle est déjà réservée pour cette plage horaire. Veuillez choisir une autre salle ou un autre créneau.'
                });
                return;
            }
        }

        setLoading(true);

        try {
            const payload = {
                date: formData.date,
                type: formData.type,
                statut: formData.statut,
                roomId: selectedRoom?.id ? Number(selectedRoom.id) : null,
                userId: 1, // À remplacer par l'ID de l'utilisateur connecté
                startTime: formData.startTime ? `${formData.date}T${formData.startTime}:00` : null,
                endTime: formData.endTime ? `${formData.date}T${formData.endTime}:00` : null
            };

            const url = editMode
                ? `http://localhost:8089/api/interventions/${id}`
                : 'http://localhost:8089/api/interventions/with-room';

            await (editMode
                ? axios.put(url, payload)
                : axios.post(url, payload));

            navigate('/InterventionList', { state: { successMessage: editMode ? 'Intervention modifiée avec succès' : 'Intervention créée avec succès' } });
        } catch (err) {
            const errorMessage = err.response?.data?.message
                || err.response?.data
                || err.message
                || 'Erreur inconnue';
            setErrors({ form: `Erreur: ${errorMessage}` });
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Chargement en cours...</div>;

    return (
        <div className="intervention-form-container">
            <h2>{editMode ? 'Modifier Intervention' : 'Nouvelle Intervention'}</h2>
            <Link to="/dashboard" className="btn btn-back">
                <i className="fas fa-arrow-left"></i> Retour au dashboard
            </Link>

            {errors.form && <div className="error-message">{errors.form}</div>}

            <form onSubmit={handleSubmit}>
                {/* Date Field */}
                <div className={`form-group ${errors.date ? 'has-error' : ''}`}>
                    <label htmlFor="date">Date:</label>
                    <input
                        id="date"
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="form-control"
                        onBlur={() => validateField('date', formData.date)}
                    />
                    {errors.date && <span className="error-text">{errors.date}</span>}
                </div>

                {/* Type Field */}
                <div className={`form-group ${errors.type ? 'has-error' : ''}`}>
                    <label htmlFor="type">Type:</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="form-control"
                        onBlur={() => validateField('type', formData.type)}
                    >
                        <option value="">Sélectionner un type</option>
                        {interventionTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                    {errors.type && <span className="error-text">{errors.type}</span>}
                </div>

                {/* Time Fields */}
                <div className="time-fields">
                    <div className={`form-group ${errors.time ? 'has-error' : ''}`}>
                        <label htmlFor="startTime">Heure de début:</label>
                        <input
                            id="startTime"
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            className="form-control"
                            onBlur={() => validateField('startTime', formData.startTime)}
                            min={formData.date === new Date().toISOString().split('T')[0] ?
                                new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : null}
                        />
                    </div>

                    <div className={`form-group ${errors.time ? 'has-error' : ''}`}>
                        <label htmlFor="endTime">Heure de fin:</label>
                        <input
                            id="endTime"
                            type="time"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            className="form-control"
                            onBlur={() => validateField('endTime', formData.endTime)}
                            min={formData.date === new Date().toISOString().split('T')[0] ?
                                new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}) : null}
                        />
                    </div>
                    {errors.time && <span className="error-text time-error">{errors.time}</span>}
                    <div className="duration-info">
                        Durée minimale: {MIN_DURATION_MINUTES} min | Durée maximale: {MAX_DURATION_HOURS} h
                    </div>
                </div>

                {/* Status Field */}
                <div className="form-group">
                    <label htmlFor="statut">Statut:</label>
                    <select
                        id="statut"
                        name="statut"
                        value={formData.statut}
                        onChange={handleChange}
                        required
                        disabled={!editMode}
                        className="form-control"
                    >
                        {statusOptions.map(status => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Room Selection */}
                <div className="room-section">
                    <button
                        type="button"
                        onClick={fetchAvailableRooms}
                        disabled={!formData.type || !formData.date || !formData.startTime || !formData.endTime || roomLoading}
                        className="btn btn-find-room"
                    >
                        {roomLoading ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Recherche en cours...
                            </>
                        ) : (
                            'Trouver une salle disponible'
                        )}
                    </button>

                    {roomLoading && <p className="loading-text">Chargement des salles disponibles...</p>}

                    {errors.rooms && <p className="error-text">{errors.rooms}</p>}

                    {availableRooms.length > 0 && (
                        <div className="room-selection">
                            <label htmlFor="room-select">Choisir une salle:</label>
                            <select
                                id="room-select"
                                value={selectedRoom?.id || ''}
                                onChange={handleRoomChange}
                                className="form-control room-select"
                            >
                                <option value="">-- Sélectionnez une salle --</option>
                                {availableRooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        {room.name} ({room.equipment})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedRoom && (
                        <div className="current-room">
                            <h4>Salle sélectionnée</h4>
                            <div className="room-info">
                                <p><strong>Nom:</strong> {selectedRoom.name}</p>
                                <p><strong>Équipement:</strong> {selectedRoom.equipment}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading || Object.keys(errors).length > 0}
                        className="btn btn-submit"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                Enregistrement...
                            </>
                        ) : (
                            'Enregistrer'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/InterventionList')}
                        className="btn btn-cancel"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InterventionForm;