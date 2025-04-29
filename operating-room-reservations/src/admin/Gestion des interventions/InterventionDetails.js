
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const InterventionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [intervention, setIntervention] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIntervention = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/interventions/${id}`);
                setIntervention(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        fetchIntervention();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
            try {
                await axios.delete(`http://localhost:8089/api/interventions/${id}`);
                navigate('/interventions');
            } catch (err) {
                alert(`Erreur lors de la suppression: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    if (loading) return <div className="loading">Chargement...</div>;
    if (error) return <div className="error">Erreur: {error}</div>;
    if (!intervention) return <div className="not-found">Intervention non trouvée</div>;

    return (
        <div className="intervention-details-container">
            <h2>Détails de l'Intervention</h2>

            <div className="details-card">
                <div className="detail-row">
                    <span className="detail-label">ID:</span>
                    <span className="detail-value">{intervention.id}</span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                        {format(new Date(intervention.date), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                        {intervention.type.replace(/_/g, ' ').toLowerCase()}
                    </span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Statut:</span>
                    <span className={`detail-value status-${intervention.statut.toLowerCase()}`}>
                        {intervention.statut.toLowerCase()}
                    </span>
                </div>
            </div>

            <div className="action-buttons">
                <button
                    onClick={() => navigate(`/interventions/edit/${id}`)}
                    className="btn-edit"
                >
                    Modifier
                </button>

                {intervention.statut !== 'ANNULEE' && intervention.statut !== 'TERMINEE' && (
                    <button
                        onClick={() => navigate(`/interventions/${id}/annuler`)}
                        className="btn-cancel"
                    >
                        Annuler
                    </button>
                )}

                <button
                    onClick={handleDelete}
                    className="btn-delete"
                >
                    Supprimer
                </button>

                <button
                    onClick={() => navigate('/interventions')}
                    className="btn-back"
                >
                    Retour à la liste
                </button>
            </div>
        </div>
    );
};

export default InterventionDetails;