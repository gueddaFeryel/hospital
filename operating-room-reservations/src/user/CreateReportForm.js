import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const CreateReportForm = ({ intervention, onReportCreated, onCancel }) => {
    const { currentUser, userData } = useAuth();
    const [formData, setFormData] = useState({
        diagnostic: '',
        complications: '',
        recommandations: '',
        notesInfirmier: '',
        statut: 'BROUILLON'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (!formData.diagnostic || !formData.recommandations) {
                throw new Error("Le diagnostic et les recommandations sont obligatoires");
            }

            const token = await currentUser.getIdToken();

            const response = await axios.post(
                `http://localhost:8089/api/rapports-postoperatoires/intervention/${intervention.id}`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-User-Role': userData.role,
                        'X-User-Id': userData.medicalStaffId,
                        'Content-Type': 'application/json'
                    }
                }
            );

            toast.success("Rapport créé avec succès");
            onReportCreated(response.data);
        } catch (error) {
            console.error("Erreur création rapport:", error);
            toast.error(error.response?.data?.message || error.message || "Erreur lors de la création du rapport");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Créer un rapport pour l'intervention #{intervention.id}</h3>
                <button
                    className="close-modal"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Diagnostic *</label>
                        <textarea
                            name="diagnostic"
                            value={formData.diagnostic}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label>Complications</label>
                        <textarea
                            name="complications"
                            value={formData.complications}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label>Recommandations *</label>
                        <textarea
                            name="recommandations"
                            value={formData.recommandations}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label>Statut *</label>
                        <select
                            name="statut"
                            value={formData.statut}
                            onChange={handleChange}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="BROUILLON">Brouillon</option>
                            <option value="SOUMIS">Soumis</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Notes infirmier</label>
                        <textarea
                            name="notesInfirmier"
                            value={formData.notesInfirmier}
                            onChange={handleChange}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-buttons">
                        <button
                            type="button"
                            className="cancel-btn"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'En cours...' : 'Créer le rapport'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateReportForm;
