import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../Gestion des salles css/RoomsByCategory.css';

const RoomsByCategory = () => {
    const [roomsByCategory, setRoomsByCategory] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    // Fonction pour charger les données des salles
    const fetchRoomsData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Récupérer les catégories disponibles
            const categoriesResponse = await axios.get('http://localhost:8080/api/rooms/categories');
            const categories = categoriesResponse.data;

            // Charger les salles pour chaque catégorie
            const roomsData = {};
            await Promise.all(
                categories.map(async (category) => {
                    try {
                        const response = await axios.get(`http://localhost:8080/api/rooms/category/${category}`);
                        roomsData[category] = response.data;
                        setExpandedCategories(prev => ({ ...prev, [category]: true }));
                    } catch (err) {
                        roomsData[category] = [];
                        console.error(`Error loading ${category} rooms:`, err);
                    }
                })
            );

            setRoomsByCategory(roomsData);
        } catch (error) {
            setError(error.message);
            console.error('Error fetching rooms data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour basculer l'affichage d'une catégorie
    const toggleCategory = (category) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }));
    };

    // Fonction pour supprimer une salle
    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette salle et toutes ses réservations ?")) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8086/api/rooms/${roomId}`);
            // Mise à jour de l'état local après suppression
            setRoomsByCategory(prev => {
                const updated = {...prev};
                for (const category in updated) {
                    updated[category] = updated[category].filter(room => room.id !== roomId);
                }
                return updated;
            });
            alert('Salle supprimée avec succès');
        } catch (error) {
            console.error('Delete error:', error);
            alert(`Erreur lors de la suppression: ${error.response?.data?.message || error.message}`);
        }
    };

    // Filtrer les salles en fonction du terme de recherche
    const filteredRoomsByCategory = Object.entries(roomsByCategory).reduce((acc, [category, rooms]) => {
        const filteredRooms = rooms.filter(room =>
            room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
            category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredRooms.length > 0 || searchTerm === '') {
            acc[category] = filteredRooms;
        }

        return acc;
    }, {});

    // Charger les données au montage du composant
    useEffect(() => {
        fetchRoomsData();
    }, []);

    // Afficher le chargement
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Chargement des salles...</p>
            </div>
        );
    }

    // Afficher les erreurs
    if (error) {
        return (
            <div className="error-container">
                <div className="error-message">
                    <p>Erreur: {error}</p>
                    <button onClick={fetchRoomsData} className="retry-btn">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    // Rendu principal
    return (
        <div className="rooms-by-category-container">
            <div className="header-section">
                <h1 className="page-title">Salles d'Opération par Catégorie</h1>

                {/* Barre de recherche */}

            </div>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Rechercher par nom, emplacement ou catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="clear-search-btn"
                        aria-label="Effacer la recherche"
                    >
                        ×
                    </button>
                )}
            </div>
            {/* Liste des catégories */}
            <div className="categories-container">
                {Object.entries(filteredRoomsByCategory).map(([category, rooms]) => (
                    <div key={category} className="category-section">
                        {/* En-tête de catégorie */}
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

                        {/* Contenu de la catégorie (si développé) */}
                        {expandedCategories[category] && (
                            <div className="category-content">
                                <div className="rooms-grid">
                                    {rooms.length > 0 ? (
                                        rooms.map(room => (
                                            <div key={room.id} className="room-card">
                                                <div className="room-content">
                                                    <h3 className="room-name">{room.name}</h3>
                                                    <p className="room-location">
                                                        <span className="label">Emplacement:</span> {room.location}
                                                    </p>
                                                    {room.capacity && (
                                                        <p className="room-capacity">
                                                            <span
                                                                className="label">Capacité:</span> {room.capacity} personnes
                                                        </p>
                                                    )}
                                                    {room.equipment && (
                                                        <p className="room-equipment">
                                                            <span className="label">Équipement:</span> {room.equipment}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="room-actions">
                                                    <Link
                                                        to={`/salles/edit/${room.id}`}
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
                                            {searchTerm ?
                                                "Aucune salle ne correspond à votre recherche" :
                                                "Aucune salle dans cette catégorie"}
                                        </div>
                                    )}
                                </div>
                                <div className="category-footer">
                                    <Link
                                        to={`/create-room?category=${encodeURIComponent(category)}`}
                                        className="add-room-to-category-btn"
                                    >
                                        + Ajouter une salle à {category}
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomsByCategory;
