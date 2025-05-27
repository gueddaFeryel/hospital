import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../Home.css'; // Fichier CSS que nous allons créer

const Home = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('day'); // 'day', 'week', 'month'

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/reservations');
                setReservations(response.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, []);

    // Statistiques calculées
    const stats = {
        totalReservations: reservations.length,
        upcomingReservations: reservations.filter(r => new Date(r.startTime) > new Date()).length,
        roomsInUse: [...new Set(reservations.map(r => r.operatingRoom?.name))].length,
        averageDuration: reservations.length > 0
            ? (reservations.reduce((acc, r) => {
            const duration = new Date(r.endTime) - new Date(r.startTime);
            return acc + duration;
        }, 0) / reservations.length) / (1000 * 60 * 60) // en heures
            : 0
    };

    // Réservations pour la période sélectionnée
    const filteredReservations = reservations.filter(reservation => {
        const start = new Date(reservation.startTime);
        const end = new Date(reservation.endTime);
        const selected = new Date(selectedDate);

        if (viewMode === 'day') {
            return start.toDateString() === selected.toDateString();
        } else if (viewMode === 'week') {
            const weekStart = new Date(selected);
            weekStart.setDate(selected.getDate() - selected.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            return start >= weekStart && start <= weekEnd;
        } else { // month
            return start.getMonth() === selected.getMonth() &&
                start.getFullYear() === selected.getFullYear();
        }
    });

    if (loading) return <div className="loading">Chargement...</div>;
    if (error) return <div className="error">Erreur: {error}</div>;

    return (
        <div className="calendar-container">
            <div className="calendar-header">
                <h2>Calendrier des Salles d'Opération</h2>

                <div className="view-controls">
                    <button
                        onClick={() => setViewMode('day')}
                        className={viewMode === 'day' ? 'active' : ''}
                    >
                        Jour
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={viewMode === 'week' ? 'active' : ''}
                    >
                        Semaine
                    </button>
                    <button
                        onClick={() => setViewMode('month')}
                        className={viewMode === 'month' ? 'active' : ''}
                    >
                        Mois
                    </button>
                </div>

                <div className="date-navigation">
                    <button onClick={() => {
                        const newDate = new Date(selectedDate);
                        if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
                        if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
                        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedDate(newDate);
                    }}>
                        &lt;
                    </button>

                    <h3>
                        {viewMode === 'day' && selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        {viewMode === 'week' && `Semaine du ${new Date(selectedDate.setDate(selectedDate.getDate() - selectedDate.getDay())).toLocaleDateString('fr-FR')}`}
                        {viewMode === 'month' && selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </h3>

                    <button onClick={() => {
                        const newDate = new Date(selectedDate);
                        if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
                        if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
                        if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedDate(newDate);
                    }}>
                        &gt;
                    </button>
                </div>
            </div>

            <div className="stats-container">
                <div className="stat-card">
                    <h3>Total Réservations</h3>
                    <p>{stats.totalReservations}</p>
                </div>
                <div className="stat-card">
                    <h3>À venir</h3>
                    <p>{stats.upcomingReservations}</p>
                </div>
                <div className="stat-card">
                    <h3>Salles utilisées</h3>
                    <p>{stats.roomsInUse}</p>
                </div>
                <div className="stat-card">
                    <h3>Durée moyenne</h3>
                    <p>{stats.averageDuration.toFixed(1)} heures</p>
                </div>
            </div>

            <div className="calendar-view">
                {viewMode === 'day' && (
                    <div className="day-view">
                        <h3>Réservations pour {selectedDate.toLocaleDateString('fr-FR')}</h3>
                        {filteredReservations.length > 0 ? (
                            <ul className="reservation-list">
                                {filteredReservations.map(reservation => (
                                    <li key={reservation.id} className="reservation-item">
                                        <div>
                                            <strong>{reservation.operatingRoom?.name || 'Salle inconnue'}</strong>
                                            <span>
                                                {new Date(reservation.startTime).toLocaleTimeString('fr-FR')} -
                                                {new Date(reservation.endTime).toLocaleTimeString('fr-FR')}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="duration-badge">
                                                {((new Date(reservation.endTime) - new Date(reservation.startTime)) / (1000 * 60 * 60)).toFixed(1)}h
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Aucune réservation prévue</p>
                        )}
                    </div>
                )}

                {viewMode === 'week' && (
                    <div className="week-view">
                        <h3>Semaine du {new Date(selectedDate.setDate(selectedDate.getDate() - selectedDate.getDay())).toLocaleDateString('fr-FR')}</h3>
                        <div className="week-grid">
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                                const day = new Date(selectedDate);
                                day.setDate(day.getDate() - day.getDay() + dayIndex);
                                const dayReservations = reservations.filter(r =>
                                    new Date(r.startTime).toDateString() === day.toDateString()
                                );

                                return (
                                    <div key={dayIndex} className="week-day">
                                        <h4>{day.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</h4>
                                        {dayReservations.length > 0 ? (
                                            <ul>
                                                {dayReservations.map(reservation => (
                                                    <li key={reservation.id}>
                                                        {reservation.operatingRoom?.name} -
                                                        {new Date(reservation.startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p>Aucune</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {viewMode === 'month' && (
                    <div className="month-view">
                        <h3>{selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h3>
                        <div className="month-grid">
                            {Array.from({ length: new Date(
                                    selectedDate.getFullYear(),
                                    selectedDate.getMonth() + 1,
                                    0
                                ).getDate() }).map((_, dayIndex) => {
                                const day = new Date(
                                    selectedDate.getFullYear(),
                                    selectedDate.getMonth(),
                                    dayIndex + 1
                                );
                                const dayReservations = reservations.filter(r =>
                                    new Date(r.startTime).toDateString() === day.toDateString()
                                );

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`month-day ${dayReservations.length > 0 ? 'has-reservations' : ''}`}
                                    >
                                        <span>{day.getDate()}</span>
                                        {dayReservations.length > 0 && (
                                            <span className="reservation-count">{dayReservations.length}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
