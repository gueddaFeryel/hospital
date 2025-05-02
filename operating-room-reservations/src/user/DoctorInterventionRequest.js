import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './DoctorInterventionRequest.css';

const DoctorInterventionRequest = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        date: '',
        type: '',
        statut: 'DEMANDE', // Changed from 'PLANIFIEE' to 'DEMANDE'
        startTime: '',
        endTime: '',
        roomId: null,
        description: '', // Added for doctor's description
        urgencyLevel: 'NORMAL' // Added for urgency level
    });

    const [availableRooms, setAvailableRooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [roomLoading, setRoomLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [doctorInfo, setDoctorInfo] = useState(null); // Added for doctor info

    // Fetch doctor info on component mount
    useEffect(() => {
        const fetchDoctorInfo = async () => {
            try {
                // Replace with actual API call to get doctor info
                const response = await axios.get('http://localhost:8080/api/doctors/me');
                setDoctorInfo(response.data);
            } catch (err) {
                console.error("Error fetching doctor info:", err);
            }
        };
        fetchDoctorInfo();
    }, []);

    const validateForm = () => {
        const errors = {};
        const today = new Date().toISOString().split('T')[0];

        // Date validation
        if (!formData.date) {
            errors.date = "La date est requise";
        } else if (formData.date < today) {
            errors.date = "Vous ne pouvez pas créer une intervention dans le passé";
        }

        // Type validation
        if (!formData.type) {
            errors.type = "Le type est requis";
        }

        // Description validation
        if (!formData.description) {
            errors.description = "Veuillez fournir une description de l'intervention";
        }

        // Time validation
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

    const handleRoomChange = (e) => {
        const roomId = e.target.value;
        const selected = availableRooms.find(r => r.id.toString() === roomId);
        setSelectedRoom(selected || null);
        setFormData(prev => ({ ...prev, roomId: selected ? selected.id : null }));
    };

    const fetchAvailableRooms = async () => {
        try {
            if (!formData.type || !formData.date) {
                alert("Veuillez d'abord sélectionner un type et une date");
                return;
            }

            setRoomLoading(true);
            setError(null);

            const startTime = formData.startTime || '08:00';
            const endTime = formData.endTime || '18:00';

            const startDateTime = `${formData.date}T${startTime}:00`;
            const endDateTime = `${formData.date}T${endTime}:00`;

            const response = await axios.get('http://localhost:8089/api/interventions/available-rooms', {
                params: {
                    startTime: startDateTime,
                    endTime: endDateTime,
                    type: formData.type
                }
            });

            setAvailableRooms(response.data || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            console.error('Error fetching rooms:', err);
        } finally {
            setRoomLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setError(Object.values(errors).join(", "));
            setLoading(false);
            return;
        }

        try {
            const payload = {
                date: formData.date,
                type: formData.type,
                statut: formData.statut,
                roomId: selectedRoom?.id ? Number(selectedRoom.id) : null,
                doctorId: doctorInfo?.id, // Using doctor's ID
                startTime: formData.startTime ? `${formData.date}T${formData.startTime}:00` : null,
                endTime: formData.endTime ? `${formData.date}T${formData.endTime}:00` : null,
                description: formData.description,
                urgencyLevel: formData.urgencyLevel,
                isRequest: true // Flag to indicate this is a request
            };

            await axios.post('http://localhost:8089/api/interventions/doctor-request', payload);

            navigate('/doctor-dashboard');
        } catch (err) {
            const errorMessage = err.response?.data?.message
                || err.response?.data
                || err.message
                || 'Erreur inconnue';
            setError(`Erreur: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Chargement en cours...</div>;

    return (
        <div className="intervention-form-container">
            <h2>Demande d'Intervention</h2>
            <Link to="/doctor-dashboard" className="btn btn-back">
                <i className="fas fa-arrow-left"></i> Retour au dashboard
            </Link>
            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Date:</label>
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
                    <label>Type:</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="form-control"
                    >
                        <option value="">Sélectionner un type</option>
                        <option value="CHIRURGIE_CARDIAQUE">Chirurgie cardiaque</option>
                        <option value="ORTHOPEDIQUE">Orthopédique</option>
                        <option value="NEUROCHIRURGIE">Neurochirurgie</option>
                        <option value="OPHTALMOLOGIQUE">Ophtalmologique</option>
                        <option value="UROLOGIE">Urologie</option>
                        <option value="GYNECOLOGIQUE">Gynécologique</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="form-control"
                        rows="4"
                    />
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

                <div className="form-group">
                    <label>Heure de début:</label>
                    <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Heure de fin:</label>
                    <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                <div className="room-section">
                    <button
                        type="button"
                        onClick={fetchAvailableRooms}
                        disabled={!formData.type || !formData.date || roomLoading}
                        className="btn btn-find-room"
                    >
                        {roomLoading ? 'Recherche en cours...' : 'Vérifier les salles disponibles'}
                    </button>

                    {roomLoading && <p>Chargement des salles disponibles...</p>}

                    {availableRooms.length > 0 && (
                        <div className="room-selection">
                            <label>Choisir une salle (optionnel):</label>
                            <select
                                value={selectedRoom?.id || ''}
                                onChange={handleRoomChange}
                                className="form-control room-select"
                            >
                                <option value="">-- Sélectionnez une salle --</option>
                                {availableRooms.map(room => (
                                    <option key={room.id} value={room.id}>
                                        {room.name} ({room.equipment})
                                        {selectedRoom?.id === room.id ? ' (sélectionnée)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {!roomLoading && availableRooms.length === 0 && formData.type && formData.date && (
                        <p className="no-room-msg">Aucune salle disponible pour les critères choisis.</p>
                    )}

                    {selectedRoom && (
                        <div className="current-room">
                            <h4>Salle suggérée</h4>
                            <div className="room-info">
                                <span className="room-name">{selectedRoom.name}</span>
                                <span className="room-equipment">{selectedRoom.equipment}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-submit"
                    >
                        {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
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
        </div>
    );
};

export default DoctorInterventionRequest;