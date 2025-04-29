import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../Gestion des interventions css/InterventionMaterials.css';

const InterventionMaterials = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [interventionMaterials, setInterventionMaterials] = useState({});
    const [allMaterials, setAllMaterials] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!id || isNaN(id)) {
            setError("ID d'intervention invalide");
            setLoading(false);
            toast.error("ID d'intervention invalide");
            navigate('/interventions');
            return;
        }
        fetchData();
    }, [id, navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [interventionResponse, materialsResponse] = await Promise.all([
                axios.get(`http://localhost:8089/api/interventions/${id}/materiels`),
                axios.get('http://localhost:8089/api/materiels')
            ]);

            // Créer un map des matériels assignés {id: true}
            const assignedMaterials = interventionResponse.data?.reduce((acc, mat) => {
                acc[mat.id] = true;
                return acc;
            }, {});

            setInterventionMaterials(assignedMaterials || {});
            setAllMaterials(materialsResponse.data?.filter(m => m.quantiteDisponible > 0) || []);
        } catch (err) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApiError = (err) => {
        console.error("Erreur API:", err);
        let errorMsg = "Erreur de connexion au serveur";

        if (err.response) {
            errorMsg = err.response.data?.message ||
                `Erreur ${err.response.status}: ${err.response.statusText}`;
        }

        setError(errorMsg);
        toast.error(errorMsg);
    };

    const toggleMaterialSelection = (materialId) => {
        setSelectedMaterials(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(materialId)) {
                newSelection.delete(materialId);
            } else {
                newSelection.add(materialId);
            }
            return newSelection;
        });
    };

    const handleAssignMaterials = async () => {
        try {
            setLoading(true);

            // Préparer les données avec quantités
            const materialsToAssign = Object.entries(selectedMaterials)
                .filter(([id, qty]) => qty > 0)
                .map(([id, quantity]) => ({
                    materialId: Number(id),
                    quantity: quantity
                }));

            const response = await axios.post(
                `http://localhost:8089/api/interventions/${id}/assign-materiel`,
                materialsToAssign,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            await fetchData();
            setSelectedMaterials({});
            toast.success("Matériels assignés avec succès !");
        } catch (err) {
            console.error("Erreur:", err.response?.data);
            toast.error(`Erreur: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };
    if (loading) return <div className="loading-spinner">Chargement...</div>;
    if (error) return <div className="error-message">Erreur: {error}</div>;

    return (
        <div className="intervention-materials-container">
            <div className="header-section">
                <h2>Gestion des Matériels</h2>
                <button onClick={() => navigate(-1)} className="back-btn">
                    ← Retour
                </button>
            </div>

            <div className="materials-management">
                <div className="available-materials">
                    <h3>Matériels disponibles</h3>
                    <div className="selection-controls">
                        <span>{selectedMaterials.size} sélectionné(s)</span>
                        <button
                            onClick={handleAssignMaterials}
                            disabled={selectedMaterials.size === 0 || loading}
                            className={`assign-btn ${selectedMaterials.size === 0 ? 'disabled' : ''}`}
                        >
                            {loading ? 'En cours...' : 'Assigner'}
                        </button>
                    </div>

                    <div className="materials-grid">
                        {allMaterials.map(material => (
                            <div
                                key={material.id}
                                className={`material-card ${selectedMaterials.has(material.id) ? 'selected' : ''} ${interventionMaterials[material.id] ? 'assigned' : ''}`}
                                onClick={() => !interventionMaterials[material.id] && toggleMaterialSelection(material.id)}
                            >
                                <div className="material-info">
                                    <h4>{material.nom}</h4>
                                    <p>Type: {material.categorie}</p>
                                    <p>Disponibles: {material.quantiteDisponible}</p>
                                    {interventionMaterials[material.id] && (
                                        <span className="assigned-tag">Déjà assigné</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="assigned-materials">
                    <h3>Matériels assignés ({Object.keys(interventionMaterials).length})</h3>
                    {Object.keys(interventionMaterials).length > 0 ? (
                        <ul>
                            {allMaterials
                                .filter(m => interventionMaterials[m.id])
                                .map(material => (
                                    <li key={material.id}>
                                        <span>{material.nom} - {material.categorie}</span>
                                    </li>
                                ))
                            }
                        </ul>
                    ) : (
                        <p className="no-materials">Aucun matériel assigné</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InterventionMaterials;
