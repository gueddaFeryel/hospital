import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import '../Gestion des salles css/CreateRoomForm.css';

const CreateRoomForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        name: '',
        location: '',
        category: ''
    });
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState({ text: '', isSuccess: false });
    const [isLoading, setIsLoading] = useState(false);
    const [categoryLocked, setCategoryLocked] = useState(false);

    useEffect(() => {
        // Vérifier si une catégorie est passée dans l'URL
        const queryParams = new URLSearchParams(location.search);
        const categoryFromUrl = queryParams.get('category');

        axios.get('http://localhost:8080/api/rooms/categories')
            .then(response => {
                setCategories(response.data);

                if (categoryFromUrl && response.data.includes(categoryFromUrl)) {
                    // Si une catégorie valide est passée dans l'URL, on la verrouille
                    setFormData(prev => ({ ...prev, category: categoryFromUrl }));
                    setCategoryLocked(true);
                } else if (response.data.length > 0) {
                    // Sinon, on prend la première catégorie disponible
                    setFormData(prev => ({ ...prev, category: response.data[0] }));
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement des catégories:', error);
                setMessage({
                    text: 'Erreur lors du chargement des catégories',
                    isSuccess: false
                });
            });
    }, [location.search]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: '', isSuccess: false });

        axios.post('http://localhost:8086/api/rooms', formData)
            .then(() => {
                setMessage({
                    text: 'Salle créée avec succès !',
                    isSuccess: true,
                });

                setFormData({
                    name: '',
                    location: '',
                    category: categories[0] || '',
                });

                setTimeout(() => {
                    navigate('/salles');
                }, 1500);
            })
            .catch(error => {
                setMessage({
                    text: `Erreur: ${error.response?.data?.message || error.message}`,
                    isSuccess: false
                });
            })
            .finally(() => setIsLoading(false));
    };

    return (
        <div className="room-form-container">
            <div className="form-card">
                <div className="form-header">
                    <h2>Nouvelle Salle d'Opération</h2>
                    <p>Remplissez les détails pour créer une nouvelle salle</p>
                    {categoryLocked && (
                        <p className="category-notice">
                            Catégorie: <strong>{formData.category}</strong>
                        </p>
                    )}
                </div>

                {message.text && (
                    <div className={`form-message ${message.isSuccess ? 'success' : 'error'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="room-form">
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">
                            Nom de la salle
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="Ex: Salle 1"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="location" className="form-label">
                            Emplacement
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            required
                            className="form-input"
                            placeholder="Ex: Bâtiment A, 2ème étage"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category" className="form-label">
                            Catégorie
                        </label>
                        {categoryLocked ? (
                            <input
                                type="text"
                                id="category-display"
                                value={formData.category}
                                readOnly
                                className="form-input locked"
                            />
                        ) : (
                            <select
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                                className="form-select"
                            >
                                {categories.map((category, index) => (
                                    <option key={index} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Création en cours...' : 'Créer la Salle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateRoomForm;
