import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Gestion des salles css/CreateMaterielForm.css'
const MaterielForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        quantiteDisponible: 1,
        categorie: 'INSTRUMENT_CHIRURGICAL'
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isEdit) {
            const fetchMateriel = async () => {
                try {
                    const response = await axios.get(`http://localhost:8089/api/materiels/${id}`);
                    setFormData({
                        nom: response.data.nom,
                        description: response.data.description,
                        quantiteDisponible: response.data.quantiteDisponible,
                        categorie: response.data.categorie
                    });
                } catch (error) {
                    toast.error('Erreur lors du chargement du matériel');
                    navigate('/materiels');
                }
            };
            fetchMateriel();
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantiteDisponible' ? parseInt(value) || 0 : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nom.trim()) newErrors.nom = 'Nom requis';
        if (!formData.description.trim()) newErrors.description = 'Description requise';
        if (formData.quantiteDisponible < 1) newErrors.quantiteDisponible = 'Quantité minimale: 1';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const config = {
                headers: { 'Content-Type': 'application/json' }
            };

            const requestData = {
                nom: formData.nom,
                description: formData.description,
                quantiteDisponible: formData.quantiteDisponible,
                categorie: formData.categorie
            };

            if (isEdit) {
                await axios.put(`http://localhost:8089/api/materiels/${id}`, requestData, config);
                toast.success('Matériel modifié avec succès');
            } else {
                await axios.post('http://localhost:8089/api/materiels', requestData, config);
                toast.success('Matériel créé avec succès');
            }
            navigate('/materiels');
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(`Erreur: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>{isEdit ? 'Modifier le Matériel' : 'Nouveau Matériel'}</h2>

            <form onSubmit={handleSubmit}>
                <div className={`form-group ${errors.nom ? 'has-error' : ''}`}>
                    <label>Nom *</label>
                    <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder="Nom du matériel"
                    />
                    {errors.nom && <span className="error">{errors.nom}</span>}
                </div>

                <div className={`form-group ${errors.description ? 'has-error' : ''}`}>
                    <label>Description *</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Description du matériel"
                        rows="3"
                    />
                    {errors.description && <span className="error">{errors.description}</span>}
                </div>

                <div className="form-group">
                    <label>Catégorie *</label>
                    <select
                        name="categorie"
                        value={formData.categorie}
                        onChange={handleChange}
                    >
                        <option value="INSTRUMENT_CHIRURGICAL">Instrument Chirurgical</option>
                        <option value="EQUIPEMENT_MEDICAL">Équipement Médical</option>
                        <option value="CONSOMMABLE">Consommable</option>
                        <option value="PROTECTION">Protection</option>
                        <option value="MEDICAMENT">Médicament</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                </div>

                <div className={`form-group ${errors.quantiteDisponible ? 'has-error' : ''}`}>
                    <label>Quantité *</label>
                    <input
                        type="number"
                        name="quantiteDisponible"
                        min="1"
                        value={formData.quantiteDisponible}
                        onChange={handleChange}
                    />
                    {errors.quantiteDisponible && <span className="error">{errors.quantiteDisponible}</span>}
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/materiels')}
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <span>En cours...</span>
                        ) : (
                            <span>{isEdit ? 'Mettre à jour' : 'Créer'}</span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MaterielForm;
