import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../Gestion des salles css/ReservationList.css';

const ReservationList = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'startTime', direction: 'desc' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const { data } = await axios.get('http://localhost:8080/api/reservations');
                setReservations(data);
            } catch (err) {
                setError('Erreur lors du chargement des réservations');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReservations();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
            try {
                await axios.delete(`http://localhost:8086/api/reservations/${id}`);
                setReservations(reservations.filter(r => r.id !== id));
            } catch (err) {
                setError('Erreur lors de la suppression');
                console.error(err);
            }
        }
    };

    const requestSort = (key) => {
        let direction = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const sortedReservations = [...reservations].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const filteredReservations = sortedReservations.filter(reservation =>
        reservation.operatingRoom?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(reservation.startTime).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(reservation.endTime).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des réservations...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-alert">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
            </div>
        </div>
    );

    return (
        <div className="reservation-list-container">
            <div className="reservation-header">
                <div className="header-content">
                    <h1>
                        <i className="fas fa-calendar-alt"></i> Gestion des Réservations
                    </h1>
                    <p>Consultez et gérez toutes les réservations de salles</p>
                </div>
                <Link to="/dashboard" className="btn btn-back">
                    <i className="fas fa-arrow-left"></i> Retour au dashboard
                </Link>
                <div className="header-actions">
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Rechercher une réservation..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => navigate('/reservations/new')}
                        className="add-button"
                    >
                        <i className="fas fa-plus"></i> Nouvelle Réservation
                    </button>
                </div>
            </div>

            <div className="reservation-table-container">
                <table className="reservation-table">
                    <thead>
                    <tr>
                        <th onClick={() => requestSort('operatingRoom.name')}>
                            Salle {sortConfig.key === 'operatingRoom.name' && (
                            <i className={`fas fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} />
                        )}
                        </th>
                        <th onClick={() => requestSort('startTime')}>
                            Date de Début {sortConfig.key === 'startTime' && (
                            <i className={`fas fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} />
                        )}
                        </th>
                        <th onClick={() => requestSort('endTime')}>
                            Date de Fin {sortConfig.key === 'endTime' && (
                            <i className={`fas fa-arrow-${sortConfig.direction === 'asc' ? 'up' : 'down'}`} />
                        )}
                        </th>
                        <th>Durée</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredReservations.length > 0 ? (
                        filteredReservations.map(reservation => {
                            const start = new Date(reservation.startTime);
                            const end = new Date(reservation.endTime);
                            const duration = Math.round((end - start) / (1000 * 60 * 60));

                            return (
                                <tr key={reservation.id}>
                                    <td>
                                        <div className="room-info">
                                            <i className="fas fa-procedures"></i>
                                            <span>{reservation.operatingRoom?.name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td>{start.toLocaleString()}</td>
                                    <td>{end.toLocaleString()}</td>
                                    <td>{duration} heure(s)</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => navigate(`/reservations/edit/${reservation.id}`)}
                                                className="edit-button"
                                            >
                                                <i className="fas fa-edit"></i> Modifier
                                            </button>
                                            <button
                                                onClick={() => handleDelete(reservation.id)}
                                                className="delete-button"
                                            >
                                                <i className="fas fa-trash-alt"></i> Supprimer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr className="no-results">
                            <td colSpan="5">
                                <i className="fas fa-calendar-times"></i>
                                Aucune réservation trouvée
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ReservationList;
