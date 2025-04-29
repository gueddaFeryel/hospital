import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../Gestion des salles css/ReservationForm.css';

const ReservationForm = ({ editMode = false }) => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        startTime: '',
        endTime: '',
        roomName: ''
    });
    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState({ text: '', isError: false });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomsResponse = await axios.get('http://localhost:8080/api/rooms');
                setRooms(roomsResponse.data);

                if (editMode && id) {
                    const reservationResponse = await axios.get(`http://localhost:8080/api/reservations/${id}`);
                    const reservation = reservationResponse.data;

                    const formatForInput = (dateString) => {
                        if (!dateString) return '';
                        const date = new Date(dateString);
                        return date.toISOString().slice(0, 16);
                    };

                    setFormData({
                        startTime: formatForInput(reservation.startTime),
                        endTime: formatForInput(reservation.endTime),
                        roomName: reservation.operatingRoom?.name || ''
                    });
                }
            } catch (error) {
                console.error("Erreur:", error.response);
                setMessage({
                    text: error.response?.data?.message || 'Erreur lors du chargement des données',
                    isError: true
                });
            }
        };
        fetchData();
    }, [editMode, id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: '', isError: false });

        if (new Date(formData.startTime) >= new Date(formData.endTime)) {
            setMessage({
                text: "L'heure de fin doit être après l'heure de début",
                isError: true
            });
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                startTime: formData.startTime,
                endTime: formData.endTime,
                operatingRoom: {
                    name: formData.roomName
                }
            };

            if (editMode) {
                await axios.put(`http://localhost:8086/api/reservations/${id}`, payload);
                setMessage({ text: 'Réservation mise à jour avec succès!', isError: false });
            } else {
                await axios.post(`http://localhost:8086/api/reservations/${formData.roomName}`, payload);
                setMessage({ text: 'Réservation créée avec succès!', isError: false });
            }

            setTimeout(() => navigate('/reservation'), 1500);
        } catch (error) {
            const errorMessage = error.response?.data?.error ||
                error.response?.data?.message ||
                'Erreur lors de la requête';
            setMessage({ text: errorMessage, isError: true });
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="modern-form-container">
            <div className="form-card">
                <div className="form-header">
                    <h2>{editMode ? 'Modifier' : 'Nouvelle'} Réservation</h2>
                    <p>Remplissez les détails de la réservation</p>
                </div>

                {message.text && (
                    <div className={`form-message ${message.isError ? 'error' : 'success'}`}>
                        <i className={`fas ${message.isError ? 'fa-exclamation-circle' : 'fa-check-circle'}`}></i>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modern-form">
                    {/* Salle d'opération */}
                    <div className="form-group floating">
                        <select
                            name="roomName"
                            value={formData.roomName}
                            onChange={handleChange}
                            required
                            className="form-input"
                            id="roomSelect"
                        >
                            <option value=""></option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.name}>
                                    {room.name} ({room.category})
                                </option>
                            ))}
                        </select>
                        <label htmlFor="roomSelect" className="form-label">Salle d'opération</label>
                        <i className="fas fa-procedures input-icon"></i>
                    </div>

                    {/* Date/heure de début */}
                    <div className="form-group floating">
                        <input
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            className="form-input"
                            id="startTime"
                        />
                        <label htmlFor="startTime" className="form-label">Date/heure de début</label>
                        <i className="fas fa-calendar-alt input-icon"></i>
                    </div>

                    {/* Date/heure de fin */}
                    <div className="form-group floating">
                        <input
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            className="form-input"
                            id="endTime"
                        />
                        <label htmlFor="endTime" className="form-label">Date/heure de fin</label>
                        <i className="fas fa-calendar-alt input-icon"></i>
                    </div>

                    {/* Boutons */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Traitement...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i> {editMode ? 'Mettre à jour' : 'Enregistrer'}
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/reservation')}
                            className="cancel-btn"
                        >
                            <i className="fas fa-times"></i> Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationForm;
