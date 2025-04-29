import React, { useState } from 'react';
import axios from 'axios';

function AddMedicalStaff() {
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        role: 'MEDECIN'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8089/api/medical-staff', formData);
            alert('Membre du staff ajouté avec succès !');
            setFormData({ nom: '', prenom: '', role: 'MEDECIN' });
        } catch (error) {
            console.error('Erreur:', error);
            alert('Échec de l\'ajout');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
            />
            <input
                type="text"
                placeholder="Prénom"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
            />
            <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
                <option value="MEDECIN">medecin</option>
                <option value="ANESTHESISTE">Anesthésiste</option>
                <option value="INFIRMIER">Infirmier</option>
            </select>
            <button type="submit">Ajouter</button>
        </form>
    );
}

export default AddMedicalStaff;
