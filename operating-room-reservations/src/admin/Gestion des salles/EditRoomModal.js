import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../Gestion des salles css/EditRoomModal.css'; // Fichier CSS que nous allons créer

const EditRoomModal = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        category: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', isError: false });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [roomRes, categoriesRes] = await Promise.all([
                    axios.get(`http://localhost:8086/api/rooms/${id}`),
                    axios.get('http://localhost:8086/api/rooms/categories')
                ]);

                setFormData({
                    name: roomRes.data.name,
                    location: roomRes.data.location,
                    category: roomRes.data.category
                });
                setCategories(categoriesRes.data);
            } catch (err) {
                console.error('Error fetching data:', err);
                setMessage({
                    text: 'Erreur lors du chargement des données',
                    isError: true
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', isError: false });

        try {
            await axios.put(`http://localhost:8086/api/rooms/${id}`, formData);
            setMessage({
                text: 'Salle mise à jour avec succès !',
                isError: false
            });
            setTimeout(() => navigate('/salles'), 1500);
        } catch (err) {
            console.error('Update error:', err);
            setMessage({
                text: err.response?.data?.message || 'Erreur lors de la mise à jour',
                isError: true
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des données...</p>
        </div>
    );

    return (
        <div className="edit-room-modal-container">
            <div className="modal-overlay" onClick={() => navigate('/salles')}></div>

            <div className="edit-room-modal">
                <div className="modal-header">
                    <h2>Modifier la Salle</h2>
                    <button
                        className="close-btn"
                        onClick={() => navigate('/salles')}
                    >
                        &times;
                    </button>
                </div>

                {message.text && (
                    <div className={`message ${message.isError ? 'error' : 'success'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="room-form">
                    <div className="form-group floating">
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder=" "
                        />
                        <label htmlFor="name" className="form-label">Nom de la salle</label>
                    </div>

                    <div className="form-group floating">
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder=" "
                        />
                        <label htmlFor="location" className="form-label">Emplacement</label>
                    </div>

                    <div className="form-group">
                        <label htmlFor="category" className="select-label">Catégorie</label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="form-select"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/salles')}
                            className="cancel-btn"
                        >
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRoomModal;
