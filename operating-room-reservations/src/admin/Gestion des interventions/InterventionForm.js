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
    const [error, setError] = useState(null);
    const [roomLoading, setRoomLoading] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);

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
                    setLoading(false);
                } catch (err) {
                    setError(err.response?.data?.message || err.message);
                    setLoading(false);
                }
            };
            fetchIntervention();
        }
    }, [editMode, id]);

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
                statut: formData.statut || 'PLANIFIEE',
                roomId: selectedRoom?.id ? Number(selectedRoom.id) : null,
                userId: 1, // Replace with actual user ID
                startTime: formData.startTime ? `${formData.date}T${formData.startTime}:00` : null,
                endTime: formData.endTime ? `${formData.date}T${formData.endTime}:00` : null
            };

            const url = editMode
                ? `http://localhost:8089/api/interventions/${id}`
                : 'http://localhost:8089/api/interventions/with-room';

            await (editMode
                ? axios.put(url, payload)
                : axios.post(url, payload));

            navigate('/InterventionList');
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
            <h2>{editMode ? 'Modifier Intervention' : 'Nouvelle Intervention'}</h2>
            <Link to="/dashboard" className="btn btn-back">
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

                <div className="form-group">
                    <label>Statut:</label>
                    <select
                        name="statut"
                        value={formData.statut}
                        onChange={handleChange}
                        required
                        disabled={!editMode}
                        className="form-control"
                    >
                        <option value="PLANIFIEE">Planifiée</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="TERMINEE">Terminée</option>
                        <option value="ANNULEE">Annulée</option>
                    </select>
                </div>

                <div className="room-section">
                    <button
                        type="button"
                        onClick={fetchAvailableRooms}
                        disabled={!formData.type || !formData.date || roomLoading}
                        className="btn btn-find-room"
                    >
                        {roomLoading ? 'Recherche en cours...' : 'Trouver une salle disponible'}
                    </button>

                    {roomLoading && <p>Chargement des salles disponibles...</p>}

                    {availableRooms.length > 0 && (
                        <div className="room-selection">
                            <label>Choisir une salle:</label>
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
                            <h4>Salle sélectionnée</h4>
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
                        {loading ? 'Enregistrement...' : 'Enregistrer'}
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