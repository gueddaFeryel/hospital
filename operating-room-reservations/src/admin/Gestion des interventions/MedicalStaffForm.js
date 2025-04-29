import React, { useState, useEffect } from 'react';
import {useParams, useNavigate, Link} from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const api = axios.create({
    baseURL: 'http://localhost:8089/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

const MedicalStaffForm = ({ editMode = false, firebaseUid = null }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firebase_uid: firebaseUid || '',
        email: '',
        nom: '',
        prenom: '',
        role: 'MEDECIN'
    });
    const [loading, setLoading] = useState(false);

    const roleOptions = [
        { value: 'MEDECIN', label: 'Médecin' },
        { value: 'INFIRMIER', label: 'Infirmier' },
        { value: 'ANESTHESISTE', label: 'Anesthésiste' }
    ];

    useEffect(() => {
        if (editMode && firebaseUid) {
            const fetchData = async () => {
                try {
                    const response = await api.get(`/medical-staff/firebase/${firebaseUid}`);
                    const validRole = roleOptions.some(o => o.value === response.data.role)
                        ? response.data.role
                        : 'MEDECIN';

                    setFormData({
                        firebase_uid: firebaseUid,
                        email: response.data.email || '',
                        nom: response.data.nom || '',
                        prenom: response.data.prenom || '',
                        role: validRole
                    });
                } catch (error) {
                    toast.error('Erreur de chargement');
                    console.error('Erreur:', error);
                }
            };
            fetchData();
        }
    }, [editMode, firebaseUid, roleOptions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editMode) {
                // Pour la mise à jour, utilisez l'endpoint update-by-firebase
                await api.put(`/medical-staff/update-by-firebase/${formData.firebase_uid}`, {
                    role: formData.role
                });
                toast.success('Mise à jour réussie');
            } else {
                // Pour la création/synchronisation, utilisez l'endpoint sync
                const payload = {
                    firebase_uid: formData.firebase_uid,
                    email: formData.email,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    role: formData.role
                };
                await api.post('/medical-staff/sync', payload);
                toast.success('Synchronisation réussie');
            }
            navigate('/medical-staff');
        } catch (error) {
            console.error('Erreur détaillée:', error);
            if (error.response) {
                console.error('Réponse erreur:', error.response.data);
                toast.error(error.response.data.message || 'Erreur lors de la requête');
            } else {
                toast.error('Erreur de connexion au serveur');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '500px' }}>
            <h2>{editMode ? 'Modifier' : 'Créer'} un membre</h2>
            <Link to="/dashboard" className="btn btn-back">
                <i className="fas fa-arrow-left"></i> Retour au dashboard
            </Link>
            <form onSubmit={handleSubmit}>
                {!editMode && (
                    <>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Firebase UID:</label>
                            <input
                                style={{ width: '100%', padding: '8px' }}
                                value={formData.firebase_uid}
                                onChange={(e) => setFormData({...formData, firebase_uid: e.target.value})}
                                required
                                disabled={editMode}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
                            <input
                                style={{ width: '100%', padding: '8px' }}
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                required={!editMode}
                                disabled={editMode}
                            />
                        </div>
                    </>
                )}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Nom:</label>
                    <input
                        style={{ width: '100%', padding: '8px' }}
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        required
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Prénom:</label>
                    <input
                        style={{ width: '100%', padding: '8px' }}
                        value={formData.prenom}
                        onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                        required
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Rôle:</label>
                    <select
                        style={{ width: '100%', padding: '8px' }}
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        required
                    >
                        {roleOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '10px 15px',
                        background: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    {loading ? 'En cours...' : 'Valider'}
                </button>
            </form>
        </div>
    );
};

export default MedicalStaffForm;
