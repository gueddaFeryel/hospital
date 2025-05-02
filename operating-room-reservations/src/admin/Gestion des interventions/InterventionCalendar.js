import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameMonth, isSameDay, isToday, differenceInMinutes,
    differenceInHours, formatDistanceToNow
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'react-toastify';
import {
    FaCalendarAlt, FaChevronLeft, FaChevronRight,
    FaClock, FaHourglassStart, FaHourglassEnd
} from 'react-icons/fa';
import '../Gestion des interventions css/Calendar.css';

const InterventionCalendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [todayInterventions, setTodayInterventions] = useState([]);
    const navigate = useNavigate();

    // Fonction pour mettre à jour le statut d'une intervention
    const updateInterventionStatus = (intervention) => {
        const now = new Date();
        const startTime = intervention.startTime ? parseISO(intervention.startTime) : null;
        const endTime = intervention.endTime ? parseISO(intervention.endTime) : null;

        if (!startTime || !endTime) return intervention;

        let newStatus = intervention.statut;

        if (now >= startTime && now <= endTime && intervention.statut !== 'EN_COURS') {
            newStatus = 'EN_COURS';
        } else if (now > endTime && intervention.statut !== 'TERMINEE') {
            newStatus = 'TERMINEE';
        }

        if (newStatus !== intervention.statut) {
            return { ...intervention, statut: newStatus };
        }
        return intervention;
    };

    useEffect(() => {
        // Mettre à jour les statuts toutes les minutes
        const interval = setInterval(() => {
            setInterventions(prevInterventions =>
                prevInterventions.map(intervention =>
                    updateInterventionStatus(intervention)
                )
            );
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchInterventions();
    }, [currentDate]);

    useEffect(() => {
        const todayInts = interventions.filter(intervention => {
            try {
                return isSameDay(parseISO(intervention.date), new Date());
            } catch {
                return false;
            }
        });
        setTodayInterventions(todayInts);
    }, [interventions]);

    const fetchInterventions = async () => {
        try {
            setLoading(true);
            const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

            const response = await axios.get('http://localhost:8089/api/interventions', {
                params: { startDate, endDate }
            });

            const interventionsData = Array.isArray(response.data) ? response.data : [];
            const interventionsWithDetails = await Promise.all(
                interventionsData.slice(0, 50).map(async (intervention) => {
                    if (!intervention?.id) return null;

                    const [roomData, staffData] = await Promise.all([
                        intervention.roomId ?
                            axios.get(`http://localhost:8086/api/rooms/${intervention.roomId}`)
                                .then(res => res.data)
                                .catch(() => ({
                                    id: intervention.roomId,
                                    name: `Salle ${intervention.roomId}`,
                                    equipment: 'Non disponible'
                                })) :
                            Promise.resolve(null),

                        axios.get(`http://localhost:8089/api/interventions/${intervention.id}/staff`)
                            .then(res => Array.isArray(res.data) ? res.data : [])
                            .catch(() => [])
                    ]);

                    const interventionWithDetails = {
                        ...intervention,
                        date: intervention.date || new Date().toISOString(),
                        room: roomData,
                        equipeMedicale: staffData
                    };

                    return updateInterventionStatus(interventionWithDetails);
                })
            );

            setInterventions(interventionsWithDetails.filter(Boolean));
        } catch (err) {
            console.error("Erreur fetchInterventions:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getInterventionsForDay = (day) => {
        return interventions.filter(intervention => {
            try {
                return isSameDay(parseISO(intervention.date), day);
            } catch {
                return false;
            }
        });
    };

    const filteredInterventions = selectedDate
        ? getInterventionsForDay(selectedDate)
        : [];

    const getTimeStatus = (intervention) => {
        const now = new Date();
        const startTime = intervention.startTime ? parseISO(intervention.startTime) : null;
        const endTime = intervention.endTime ? parseISO(intervention.endTime) : null;

        if (!startTime || !endTime) return null;

        if (intervention.statut === 'TERMINEE') {
            return `Terminée ${formatDistanceToNow(endTime, { addSuffix: true })}`;
        } else if (intervention.statut === 'EN_COURS') {
            const mins = differenceInMinutes(endTime, now);
            const hours = differenceInHours(endTime, now);

            if (hours > 0) {
                return `Finit dans ${hours} heure${hours > 1 ? 's' : ''}`;
            } else if (mins > 0) {
                return `Finit dans ${mins} minute${mins > 1 ? 's' : ''}`;
            } else {
                return `Doit finir maintenant`;
            }
        } else {
            const mins = differenceInMinutes(startTime, now);
            const hours = differenceInHours(startTime, now);

            if (hours > 0) {
                return `Commence dans ${hours} heure${hours > 1 ? 's' : ''}`;
            } else if (mins > 0) {
                return `Commence dans ${mins} minute${mins > 1 ? 's' : ''}`;
            } else {
                return `Doit commencer maintenant`;
            }
        }
    };

    const handleCancel = async (id) => {
        try {
            await axios.patch(`http://localhost:8089/api/interventions/${id}/annuler`);
            setInterventions(prev => prev.map(i =>
                i.id === id ? { ...i, statut: 'ANNULEE' } : i
            ));
            toast.success("Intervention annulée avec succès");
        } catch (err) {
            toast.error(`Échec de l'annulation : ${err.response?.data?.message || err.message}`);
        }
    };

    if (error) return <div className="error">Erreur : {error}</div>;

    return (
        <div className="intervention-container">
            <div className="header-container">
                <h2 className="header">Calendrier des Interventions</h2>
                <Link to="/dashboard" className="btn btn-back">
                    <i className="fas fa-arrow-left"></i> Retour au dashboard
                </Link>
            </div>

            {todayInterventions.length > 0 && (
                <div className="today-interventions">
                    <h3>
                        <FaCalendarAlt /> Interventions aujourd'hui ({format(new Date(), 'dd/MM/yyyy', { locale: fr })})
                    </h3>
                    <div className="today-cards">
                        {todayInterventions.map(intervention => {
                            const timeStatus = getTimeStatus(intervention);
                            const isUpcoming = intervention.statut === 'PLANIFIEE';
                            const isInProgress = intervention.statut === 'EN_COURS';

                            return (
                                <div key={intervention.id} className={`today-card 
                                    ${isUpcoming ? 'upcoming' : ''} 
                                    ${isInProgress ? 'in-progress' : ''}`}>
                                    <div className="today-card-header">
                                        <span className="intervention-time">
                                            {intervention.startTime
                                                ? format(parseISO(intervention.startTime), 'HH:mm')
                                                : '--:--'}
                                            {intervention.endTime && ` - ${format(parseISO(intervention.endTime), 'HH:mm')}`}
                                        </span>
                                        <span className={`status-badge status-${intervention.statut?.toLowerCase() || 'inconnu'}`}>
                                            {intervention.statut?.toLowerCase() || 'inconnu'}
                                        </span>
                                    </div>
                                    <div className="today-card-body">
                                        <h4>{intervention.type?.replace(/_/g, ' ').toLowerCase() || 'Non spécifié'}</h4>
                                        <p>{intervention.room?.name || 'Salle non attribuée'}</p>
                                        {timeStatus && (
                                            <div className="time-status">
                                                {isUpcoming ? <FaHourglassStart /> :
                                                    isInProgress ? <FaClock /> : <FaHourglassEnd />}
                                                <span>{timeStatus}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="today-card-actions">
                                        <button
                                            onClick={() => navigate(`/interventions/${intervention.id}`)}
                                            className="btn-action details-btn"
                                        >
                                            Détails
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="calendar-controls">
                <button onClick={prevMonth} className="nav-button">
                    <FaChevronLeft />
                </button>
                <h3 className="month-title">
                    {format(currentDate, 'MMMM yyyy', { locale: fr })}
                </h3>
                <button onClick={nextMonth} className="nav-button">
                    <FaChevronRight />
                </button>
            </div>

            <div className="calendar-grid">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                    <div key={day} className="calendar-day-header">
                        {day}
                    </div>
                ))}

                {monthDays.map((day) => {
                    const dayInterventions = getInterventionsForDay(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);

                    return (
                        <div
                            key={day.toString()}
                            className={`calendar-day 
                                ${isCurrentMonth ? '' : 'other-month'} 
                                ${isSelected ? 'selected-day' : ''}
                                ${isTodayDate ? 'today-day' : ''}`}
                            onClick={() => setSelectedDate(day)}
                        >
                            <div className="day-number">
                                {format(day, 'd')}
                                {isTodayDate && <div className="today-marker">Aujourd'hui</div>}
                            </div>
                            {dayInterventions.length > 0 && (
                                <div className="intervention-indicator">
                                    {dayInterventions.length} intervention(s)
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="interventions-list">
                <h3>
                    {selectedDate
                        ? `Interventions du ${format(selectedDate, 'dd/MM/yyyy', { locale: fr })}`
                        : "Sélectionnez une date pour voir les interventions"}
                </h3>

                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Chargement des interventions...</p>
                    </div>
                ) : filteredInterventions.length > 0 ? (
                    <table className="intervention-table">
                        <thead>
                        <tr>
                            <th>Heure</th>
                            <th>Type</th>
                            <th>Statut</th>
                            <th>Salle</th>
                            <th>Temps</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredInterventions.map(intervention => {
                            const timeStatus = getTimeStatus(intervention);
                            const isUpcoming = intervention.statut === 'PLANIFIEE';
                            const isInProgress = intervention.statut === 'EN_COURS';

                            return (
                                <tr key={intervention.id}>
                                    <td>
                                        {intervention.startTime
                                            ? format(parseISO(intervention.startTime), 'HH:mm')
                                            : 'Non défini'}
                                        {intervention.endTime && ` - ${format(parseISO(intervention.endTime), 'HH:mm')}`}
                                    </td>
                                    <td className="type-cell">
                                        {intervention.type?.replace(/_/g, ' ').toLowerCase() || 'Non spécifié'}
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${intervention.statut?.toLowerCase() || 'inconnu'}`}>
                                            {intervention.statut?.toLowerCase() || 'inconnu'}
                                        </span>
                                    </td>
                                    <td>
                                        {intervention.room ? (
                                            <div className="room-info">
                                                <span className="room-name">{intervention.room.name}</span>
                                            </div>
                                        ) : (
                                            <span className="no-room">Non attribuée</span>
                                        )}
                                    </td>
                                    <td>
                                        {timeStatus && (
                                            <div className={`time-status 
                                                ${isUpcoming ? 'upcoming' : ''} 
                                                ${isInProgress ? 'in-progress' : ''}`}>
                                                {timeStatus}
                                            </div>
                                        )}
                                    </td>
                                    <td className="actions-cell">
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => navigate(`/interventions/edit/${intervention.id}`)}
                                                className="btn-action edit-btn"
                                                title="Modifier"
                                            >
                                                ✏️ Modifier
                                            </button>

                                            {['PLANIFIEE', 'EN_COURS'].includes(intervention.statut) && (
                                                <button
                                                    onClick={() => handleCancel(intervention.id)}
                                                    className="btn-action cancel-btn"
                                                    title="Annuler"
                                                >
                                                    ❌ Annuler
                                                </button>
                                            )}

                                            <button
                                                onClick={() => navigate(`/interventions/${intervention.id}`)}
                                                className="btn-action details-btn"
                                                title="Détails"
                                            >
                                                🔍 Détails
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                ) : (
                    <div className="no-interventions">
                        {selectedDate
                            ? "Aucune intervention prévue pour cette date"
                            : "Veuillez sélectionner une date pour afficher les interventions"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterventionCalendar;
