import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './DoctorInterventionRequest.css';

const DoctorInterventionRequest = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date: '',
        type: '',
        statut: 'DEMANDE',
        startTime: '',
        endTime: '',
        description: '',
        urgencyLevel: 'NORMAL'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [doctorInfo, setDoctorInfo] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [interventionTypes, setInterventionTypes] = useState([]);

    useEffect(() => {
        const fetchDoctorInfo = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:8080/api/doctors/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setDoctorInfo(response.data);
            } catch (err) {
                console.error("Error fetching doctor info:", err);
            }
        };

        const fetchInterventionTypes = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/interventions/types');
                setInterventionTypes(response.data);
            } catch (err) {
                console.error("Failed to fetch intervention types", err);
            }
        };

        fetchDoctorInfo();
        fetchInterventionTypes();
    }, []);

    const validateForm = () => {
        const errors = {};
        const today = new Date().toISOString().split('T')[0];

        if (!formData.date) {
            errors.date = "La date est requise";
        } else if (formData.date < today) {
            errors.date = "Vous ne pouvez pas créer une intervention dans le passé";
        }

        if (!formData.type) {
            errors.type = "Le type est requis";
        }

        if (!formData.description) {
            errors.description = "Veuillez fournir une description de l'intervention";
        }

        if (formData.startTime && formData.endTime) {
            const start = new Date(`${formData.date}T${formData.startTime}`);
            const end = new Date(`${formData.date}T${formData.endTime}`);

            if (start >= end) {
                errors.time = "L'heure de fin doit être après l'heure de début";
            }

            const durationHours = (end - start) / (1000 * 60 * 60);
            if (durationHours > 24) {
                errors.time = "La durée ne doit pas dépasser 24 heures";
            }
        }

        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setError(Object.values(errors).join(", "));
            setLoading(false);
            return;
        }

        try {
            const payload = {
                date: formData.date,
                type: formData.type,
                statut: 'DEMANDE',
                doctorId: doctorInfo?.id,
                startTime: formData.startTime ? `${formData.date}T${formData.startTime}:00` : null,
                endTime: formData.endTime ? `${formData.date}T${formData.endTime}:00` : null,
                description: formData.description,
                urgencyLevel: formData.urgencyLevel,
                isRequest: true
            };

            const token = localStorage.getItem('token');
            await axios.post('http://localhost:8080/api/interventions', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            setSuccessMessage("Demande envoyée avec succès! Une notification a été envoyée à l'administrateur.");

            setTimeout(() => {
                setFormData({
                    date: '',
                    type: '',
                    statut: 'DEMANDE',
                    startTime: '',
                    endTime: '',
                    description: '',
                    urgencyLevel: 'NORMAL'
                });
                setSuccessMessage(null);
            }, 3000);

        } catch (err) {
            let errorMessage = 'Erreur lors de la soumission';
            if (err.response) {
                if (err.response.status === 401) {
                    errorMessage = "Votre session a expiré, veuillez vous reconnecter";
                    navigate('/login');
                } else if (err.response.data && err.response.data.errors) {
                    errorMessage = Object.values(err.response.data.errors).join(", ");
                } else {
                    errorMessage = err.response.data?.message || err.response.data;
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Chargement en cours...</div>;

    return (
        <div className="intervention-form-container">
            <h2>Demande d'Intervention</h2>
            <Link to="/home" className="btn btn-back">
                <i className="fas fa-arrow-left"></i> Retour à l'accueil
            </Link>

            {error && <div className="error">{error}</div>}
            {successMessage && <div className="success">{successMessage}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Date:</label>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Type:</label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        required
                        className="form-control"
                    >
                        <option value="">Sélectionner un type</option>
                        {interventionTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="form-control"
                        rows="4"
                    />
                </div>

                <div className="form-group">
                    <label>Niveau d'urgence:</label>
                    <select
                        name="urgencyLevel"
                        value={formData.urgencyLevel}
                        onChange={handleChange}
                        className="form-control"
                    >
                        <option value="FAIBLE">Faible</option>
                        <option value="NORMAL">Normal</option>
                        <option value="ELEVEE">Élevée</option>
                        <option value="URGENT">Urgent</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Heure de début (optionnel):</label>
                    <input
                        type="time"
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                <div className="form-group">
                    <label>Heure de fin (optionnel):</label>
                    <input
                        type="time"
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleChange}
                        className="form-control"
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-submit"
                    >
                        {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/home')}
                        className="btn btn-cancel"
                    >
                        Annuler
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DoctorInterventionRequest;