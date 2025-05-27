import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileMedical, faSave } from '@fortawesome/free-solid-svg-icons';
import './RapportPostOperatoire.css';

function RapportPostOperatoire() {
    const { interventionId } = useParams();
    useNavigate();
    const [rapport, setRapport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        diagnostic: '',
        complications: '',
        recommandations: '',
        notesInfirmier: ''
    });

    useEffect(() => {
        const fetchRapport = async () => {
            try {
                const response = await fetch(`http://localhost:8089/api/rapports-postoperatoires/intervention/${interventionId}`);
                if (response.ok) {
                    const data = await response.json();
                    setRapport(data);
                    setFormData({
                        diagnostic: data.diagnostic || '',
                        complications: data.complications || '',
                        recommandations: data.recommandations || '',
                        notesInfirmier: data.notesInfirmier || ''
                    });
                } else {
                    setRapport(null);
                }
                setLoading(false);
            } catch (error) {
                console.error("Erreur lors de la récupération du rapport:", error);
                setLoading(false);
            }
        };

        fetchRapport();
    }, [interventionId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:8089/api/rapports-postoperatoires/${rapport.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': '1' // À remplacer par l'ID de l'utilisateur connecté
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const updatedRapport = await response.json();
                setRapport(updatedRapport);
                setEditing(false);
                alert('Rapport mis à jour avec succès!');
            } else {
                const errorData = await response.json();
                alert(`Erreur: ${errorData.message || 'Erreur lors de la mise à jour'}`);
            }
        } catch (error) {
            console.error("Erreur lors de la mise à jour du rapport:", error);
            alert('Une erreur est survenue');
        }
    };

    if (loading) {
        return <div className="loading-spinner"></div>;
    }

    return (
        <div className="rapport-container">
            <div className="rapport-header">
                <h2>
                    <FontAwesomeIcon icon={faFileMedical} />
                    Rapport Postopératoire - Intervention #{interventionId}
                </h2>
                {rapport && (
                    <span className={`status-badge ${rapport.statut.toLowerCase()}`}>
                        {rapport.statut}
                    </span>
                )}
            </div>

            {!rapport ? (
                <div className="empty-state">
                    <p>Aucun rapport postopératoire n'a été créé pour cette intervention.</p>
                    <button className="create-btn">
                        Créer un rapport
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className="form-section">
                        <label>Diagnostic*</label>
                        {editing ? (
                            <textarea
                                name="diagnostic"
                                value={formData.diagnostic}
                                onChange={handleInputChange}
                                required
                            />
                        ) : (
                            <div className="readonly-field">{rapport.diagnostic || 'Non renseigné'}</div>
                        )}
                    </div>

                    <div className="form-section">
                        <label>Complications</label>
                        {editing ? (
                            <textarea
                                name="complications"
                                value={formData.complications}
                                onChange={handleInputChange}
                            />
                        ) : (
                            <div className="readonly-field">{rapport.complications || 'Aucune complication'}</div>
                        )}
                    </div>

                    <div className="form-section">
                        <label>Recommandations*</label>
                        {editing ? (
                            <textarea
                                name="recommandations"
                                value={formData.recommandations}
                                onChange={handleInputChange}
                                required
                            />
                        ) : (
                            <div className="readonly-field">{rapport.recommandations || 'Non renseigné'}</div>
                        )}
                    </div>

                    <div className="form-section">
                        <label>Notes Infirmier</label>
                        {editing ? (
                            <textarea
                                name="notesInfirmier"
                                value={formData.notesInfirmier}
                                onChange={handleInputChange}
                            />
                        ) : (
                            <div className="readonly-field">{rapport.notesInfirmier || 'Aucune note'}</div>
                        )}
                    </div>

                    <div className="form-actions">
                        {editing ? (
                            <>
                                <button type="submit" className="save-btn">
                                    <FontAwesomeIcon icon={faSave} /> Enregistrer
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setEditing(false)}
                                >
                                    Annuler
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="edit-btn"
                                onClick={() => setEditing(true)}
                            >
                                Modifier
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

export default RapportPostOperatoire;