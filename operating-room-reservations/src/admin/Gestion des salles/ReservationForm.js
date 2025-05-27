import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../Gestion des salles css/ReservationForm.css';

const MAX_RESERVATION_HOURS = 12;
const MIN_RESERVATION_MINUTES = 30;

const ReservationForm = ({ editMode = false }) => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        startTime: '',
        endTime: '',
        roomName: ''
    });
    const [rooms, setRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingConflict, setIsCheckingConflict] = useState(false);
    const [hasConflict, setHasConflict] = useState(false);
    const [conflictMessage, setConflictMessage] = useState(''); // New state for detailed conflict message
    const [initialLoad, setInitialLoad] = useState(true);
    const navigate = useNavigate();

    const getCurrentDateTime = () => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    };

    const formatForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    };

    const checkConflict = async () => {
        if (!formData.roomName || !formData.startTime || !formData.endTime) {
            setHasConflict(false);
            setConflictMessage('');
            return;
        }

        const now = new Date();
        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);

        // Skip conflict check if reservation is in the past
        if (end < now) {
            setHasConflict(false);
            setConflictMessage('');
            return;
        }

        setIsCheckingConflict(true);
        try {
            // Check reservation conflicts
            const reservationResponse = await axios.get('http://localhost:8086/api/reservations/check-conflict', {
                params: {
                    roomName: formData.roomName,
                    startTime: `${formData.startTime}:00`,
                    endTime: `${formData.endTime}:00`,
                    excludeId: editMode ? id : null
                }
            });

            // Check intervention conflicts
            const room = rooms.find(r => r.name === formData.roomName);
            if (!room) {
                setHasConflict(true);
                setConflictMessage('Salle invalide');
                setIsCheckingConflict(false);
                return;
            }

            const interventionResponse = await axios.get('http://localhost:8089/api/interventions/check-conflict', {
                params: {
                    roomId: room.id,
                    startTime: `${formData.startTime}:00`,
                    endTime: `${formData.endTime}:00`,
                    interventionId: null // No intervention ID for reservations
                }
            });

            const hasReservationConflict = reservationResponse.data.hasConflict;
            const hasInterventionConflict = interventionResponse.data.hasConflict;

            setHasConflict(hasReservationConflict || hasInterventionConflict);
            setConflictMessage(
                hasReservationConflict && hasInterventionConflict
                    ? 'Conflit détecté : la salle est réservée et assignée à une intervention pour cette plage horaire.'
                    : hasReservationConflict
                        ? 'Conflit détecté : la salle est déjà réservée pour cette plage horaire.'
                        : hasInterventionConflict
                            ? 'Conflit détecté : la salle est assignée à une intervention pour cette plage horaire.'
                            : ''
            );
        } catch (error) {
            console.error('Erreur vérification conflit:', error);
            setHasConflict(false);
            setConflictMessage('');
            toast.error('Erreur lors de la vérification des conflits. Veuillez réessayer.');
        } finally {
            setIsCheckingConflict(false);
            if (initialLoad) setInitialLoad(false);
        }
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                const roomsResponse = await axios.get('http://localhost:8086/api/rooms');
                setRooms(roomsResponse.data);

                if (editMode && id) {
                    const reservationResponse = await axios.get(`http://localhost:8086/api/reservations/${id}`);
                    const reservation = reservationResponse.data;

                    setFormData({
                        startTime: formatForInput(reservation.startTime),
                        endTime: formatForInput(reservation.endTime),
                        roomName: reservation.operatingRoom?.name || ''
                    });
                } else {
                    const defaultStartTime = new Date();
                    defaultStartTime.setMinutes(defaultStartTime.getMinutes() + 30);
                    setFormData({
                        startTime: formatForInput(defaultStartTime),
                        endTime: formatForInput(new Date(defaultStartTime.getTime() + MIN_RESERVATION_MINUTES * 60000)),
                        roomName: ''
                    });
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Erreur lors du chargement des données');
            }
        };
        fetchData();
    }, [editMode, id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            checkConflict();
        }, 200);

        return () => clearTimeout(timer);
    }, [formData.roomName, formData.startTime, formData.endTime]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const start = new Date(formData.startTime);
        const end = new Date(formData.endTime);
        const now = new Date();
        const durationMinutes = (end - start) / (1000 * 60);

        // Validations
        if (end < now) {
            toast.error("Impossible de créer une réservation dans le passé");
            setIsLoading(false);
            return;
        }

        if (start < now) {
            toast.error("La date de début ne peut pas être dans le passé");
            setIsLoading(false);
            return;
        }

        if (end <= start) {
            toast.error(`La date de fin doit être au moins ${MIN_RESERVATION_MINUTES} minutes après la date de début`);
            setIsLoading(false);
            return;
        }

        if (durationMinutes < MIN_RESERVATION_MINUTES) {
            toast.error(`La durée minimale est de ${MIN_RESERVATION_MINUTES} minutes`);
            setIsLoading(false);
            return;
        }

        if (durationMinutes > MAX_RESERVATION_HOURS * 60) {
            toast.error(`La durée maximale est de ${MAX_RESERVATION_HOURS} heures`);
            setIsLoading(false);
            return;
        }

        if (hasConflict && !initialLoad) {
            toast.error(conflictMessage);
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                startTime: `${formData.startTime}:00`,
                endTime: `${formData.endTime}:00`
            };

            if (editMode) {
                await axios.put(`http://localhost:8086/api/reservations/${id}`, payload);
                toast.success('Réservation mise à jour avec succès !');
            } else {
                await axios.post(
                    `http://localhost:8086/api/reservations/${formData.roomName}`,
                    payload,
                    { headers: { 'Content-Type': 'application/json' } }
                );
                toast.success('Réservation créée avec succès !');
            }

            setTimeout(() => navigate('/reservations'), 1500);
        } catch (error) {
            const errorMsg = error.response?.data?.error ||
                error.response?.data?.message ||
                'Erreur lors de la création/mise à jour de la réservation';
            toast.error(`Erreur : ${errorMsg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: value
            };

            if (name === 'startTime' && newData.endTime) {
                const newStart = new Date(value);
                const currentEnd = new Date(newData.endTime);

                if (newStart >= currentEnd ||
                    (currentEnd - newStart) < MIN_RESERVATION_MINUTES * 60000) {
                    const newEndTime = new Date(newStart.getTime() + MIN_RESERVATION_MINUTES * 60000);
                    newData.endTime = formatForInput(newEndTime);
                }
            }

            return newData;
        });

        if (name === 'startTime' && new Date(value) < new Date()) {
            toast.warn("La date de début a été ajustée à l'heure actuelle", {
                autoClose: 3000
            });
        }
    };

    const getMinEndTime = () => {
        if (!formData.startTime) return getCurrentDateTime();
        const start = new Date(formData.startTime);
        const minEnd = new Date(start.getTime() + MIN_RESERVATION_MINUTES * 60000);
        return formatForInput(minEnd);
    };

    const isReservationExpired = () => {
        if (!formData.endTime) return false;
        return new Date(formData.endTime) < new Date();
    };

    return (
        <div className="modern-form-container">
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            <div className="form-card">
                <div className="form-header">
                    <h2>{editMode ? 'Modifier' : 'Nouvelle'} Réservation</h2>
                    <p>Durée : min {MIN_RESERVATION_MINUTES}min - max {MAX_RESERVATION_HOURS}h</p>
                </div>

                <form onSubmit={handleSubmit} className="modern-form" noValidate>
                    <div className="form-group floating">
                        <select
                            name="roomName"
                            value={formData.roomName}
                            onChange={handleChange}
                            required
                            disabled={editMode}
                            className="form-input"
                        >
                            <option value="">Sélectionnez une salle</option>
                            {rooms.map(room => (
                                <option key={room.id} value={room.name}>
                                    {room.name} ({room.category})
                                </option>
                            ))}
                        </select>
                        <label className="form-label">Salle d'opération</label>
                    </div>

                    <div className="form-group floating">
                        <input
                            type="datetime-local"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            required
                            className="form-input"
                            min={getCurrentDateTime()}
                        />
                        <label className="form-label">Date/heure de début</label>
                    </div>

                    <div className="form-group floating">
                        <input
                            type="datetime-local"
                            name="endTime"
                            value={formData.endTime}
                            onChange={handleChange}
                            required
                            className="form-input"
                            min={getMinEndTime()}
                        />
                        <label className="form-label">Date/heure de fin</label>
                    </div>

                    {formData.roomName && formData.startTime && formData.endTime && (
                        <div className={`conflict-indicator ${
                            isReservationExpired() ? 'expired' :
                                hasConflict ? 'conflict' : 'no-conflict'
                        }`}>
                            {isCheckingConflict ? (
                                <><i className="fas fa-spinner fa-spin"></i> Vérification...</>
                            ) : isReservationExpired() ? (
                                <><i className="fas fa-clock"></i> Plage horaire expirée</>
                            ) : hasConflict ? (
                                <><i className="fas fa-exclamation-triangle"></i> {conflictMessage}</>
                            ) : (
                                <><i className="fas fa-check-circle"></i> Salle disponible</>
                            )}
                        </div>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading || hasConflict || isCheckingConflict || isReservationExpired()}
                        >
                            {isLoading ? (
                                <><i className="fas fa-spinner fa-spin"></i> Traitement...</>
                            ) : (
                                <><i className="fas fa-save"></i> {editMode ? 'Mettre à jour' : 'Enregistrer'}</>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/reservations')}
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
