import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../Gestion des salles css/RoomsByCategory.css';

const RoomsByCategory = () => {
    const [roomsByCategory, setRoomsByCategory] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});

    const fetchRoomsData = async () => {
        try {
            setIsLoading(true);
            const categoriesResponse = await axios.get('http://localhost:8080/api/rooms/categories');
            const categories = categoriesResponse.data;

            const roomsGroupedByCategory = {};
            await Promise.all(
                categories.map(async (category) => {
                    try {
                        const response = await axios.get(`http://localhost:8080/api/rooms/category/${category}`);
                        roomsGroupedByCategory[category] = response.data;
                        setExpandedCategories(prev => ({ ...prev, [category]: true }));
                    } catch (err) {
                        roomsGroupedByCategory[category] = [];
                        console.error(`Error loading ${category} rooms:`, err);
                    }
                })
            );
            setRoomsByCategory(roomsGroupedByCategory);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette salle et toutes ses réservations ?")) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8086/api/rooms/${roomId}`);
            setRoomsByCategory(prev => {
                const updated = {...prev};
                for (const category in updated) {
                    updated[category] = updated[category].filter(room => room.id !== roomId);
                }
                return updated;
            });
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Erreur lors de la suppression: ${error.response?.data?.message || error.message}`);
        }
    };

    useEffect(() => {
        fetchRoomsData();
    }, []);

    if (isLoading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des salles...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-message">
                Erreur: {error}
                <button onClick={fetchRoomsData} className="retry-btn">
                    Réessayer
                </button>
            </div>
        </div>
    );

    return (
        <div className="rooms-by-category-container">
            <div className="header-section">
                <h1 className="page-title">Salles d'Opération par Catégorie</h1>
                <Link to="/create-room" className="add-room-btn">
                    + Ajouter une Salle
                </Link>
            </div>
            <Link to="/dashboard" className="btn btn-back">
                <i className="fas fa-arrow-left"></i> Retour au dashboard
            </Link>
            <div className="categories-container">
                {Object.entries(roomsByCategory).map(([category, rooms]) => (
                    <div key={category} className="category-section">
                        <div
                            className="category-header"
                            onClick={() => toggleCategory(category)}
                        >
                            <h2 className="category-title">
                                {category}
                                <span className="room-count">({rooms.length})</span>
                            </h2>
                            <span className="toggle-icon">
                                {expandedCategories[category] ? '−' : '+'}
                            </span>
                        </div>

                        {expandedCategories[category] && (
                            <div className="rooms-grid">
                                {rooms.length > 0 ? (
                                    rooms.map(room => (
                                        <div key={room.id} className="room-card">
                                            <div className="room-content">
                                                <h3 className="room-name">{room.name}</h3>
                                                <p className="room-location">
                                                    <span className="label">Emplacement:</span> {room.location}
                                                </p>
                                            </div>
                                            <div className="room-actions">
                                                <Link
                                                    to={`/edit-room/${room.id}`}
                                                    className="action-btn edit-btn"
                                                >
                                                    Modifier
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteRoom(room.id)}
                                                    className="action-btn delete-btn"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-category">
                                        Aucune salle dans cette catégorie
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomsByCategory;
