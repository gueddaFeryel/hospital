import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Gestion des salles css/MaterielList.css';

const MaterielList = () => {
    const [materiels, setMateriels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchMateriels = async () => {
            try {
                const response = await axios.get('http://localhost:8089/api/materiels');
                setMateriels(response.data);
                setLoading(false);
            } catch (error) {
                setError(error.response?.data?.message || error.message);
                setLoading(false);
            }
        };
        fetchMateriels();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce matériel?')) {
            try {
                await axios.delete(`http://localhost:8089/api/materiels/${id}`);
                setMateriels(materiels.filter(materiel => materiel.id !== id));
                toast.success('Matériel supprimé avec succès');
            } catch (error) {
                toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
            }
        }
    };

    const ajusterStock = async (id, quantite, augmentation) => {
        try {
            const response = await axios.patch(
                `http://localhost:8089/api/materiels/${id}/ajuster-stock`,
                null,
                { params: { quantite, augmentation } }
            );

            setMateriels(materiels.map(m =>
                m.id === id ? response.data : m
            ));
            toast.success(`Stock ${augmentation ? 'augmenté' : 'diminué'} avec succès`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Erreur lors de l'ajustement");
        }
    };

    const filteredMateriels = materiels.filter(materiel =>
        materiel.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (materiel.description && materiel.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        materiel.categorie.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Chargement en cours...</div>;
    if (error) return <div className="error">Erreur: {error}</div>;

    return (
        <div className="materiel-list-container">
            <div className="list-header">
                <h2>Liste des Matériels</h2>


            </div>
            <Link to="/materiels/new" className="btn add-btn">
                <i className="fas fa-plus"></i> Ajouter un Matériel
            </Link>
            <div className="search-container">
                <input
                    type="text"
                    className="search-bar"
                    placeholder="Rechercher par nom, description ou catégorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <i className="fas fa-search search-icon"></i>
            </div>

            <table className="materiel-table">
                <thead>
                <tr>
                    <th>Nom</th>
                    <th>Description</th>
                    <th>Catégorie</th>
                    <th>Quantité</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {filteredMateriels.map(materiel => (
                    <tr key={materiel.id}>
                        <td data-label="Nom">{materiel.nom}</td>
                        <td data-label="Description">{materiel.description}</td>
                        <td data-label="Catégorie">{materiel.categorie}</td>
                        <td data-label="Quantité" className="quantity-display">
                            {materiel.quantiteDisponible}
                        </td>
                        <td data-label="Actions" className="actions">
                            <div className="action-buttons">
                                <button
                                    onClick={() => ajusterStock(materiel.id, 1, false)}
                                    className="btn stock-btn decrease"
                                    disabled={materiel.quantiteDisponible <= 0}
                                >
                                    <i className="fas fa-minus-circle"></i> Diminuer
                                </button>

                                <button
                                    onClick={() => ajusterStock(materiel.id, 1, true)}
                                    className="btn stock-btn increase"
                                >
                                    <i className="fas fa-plus-circle"></i> Augmenter
                                </button>

                                <Link
                                    to={`/materiels/edit/${materiel.id}`}
                                    className="btn edit-btn"
                                >
                                    <i className="fas fa-edit"></i> Modifier
                                </Link>

                                <button
                                    onClick={() => handleDelete(materiel.id)}
                                    className="btn delete-btn"
                                >
                                    <i className="fas fa-trash-alt"></i> Supprimer
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {filteredMateriels.length === 0 && (
                <div className="no-results">
                    Aucun matériel trouvé
                </div>
            )}
        </div>
    );
};

export default MaterielList;
