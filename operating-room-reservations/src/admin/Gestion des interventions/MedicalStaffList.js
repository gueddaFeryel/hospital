import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../Gestion des interventions css/MedicalStaffList.css';

const MedicalStaffList = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Définir les rôles UI autorisés
    const UI_ROLES = {
        MEDECIN: 'Médecin',
        INFIRMIER: 'Infirmier',
        ANESTHESISTE: 'Anesthésiste'
    };

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const response = await axios.get('http://localhost:8089/api/medical-staff');
                const filteredStaff = response.data.filter(person =>
                    Object.keys(UI_ROLES).includes(person.role)
                );
                console.log('Fetched staff:', filteredStaff); // Debug
                setStaff(filteredStaff);
            } catch (error) {
                console.error('Fetch error:', error);
                toast.error('Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre du personnel ?')) {
            try {
                const response = await axios.delete(`http://localhost:8089/api/medical-staff/${id}`, {
                    validateStatus: function (status) {
                        return status === 204 || status === 404 || status === 409;
                    }
                });

                if (response.status === 204) {
                    setStaff(prev => prev.filter(p => p.id !== id));
                    toast.success('Membre supprimé avec succès');
                } else if (response.status === 409) {
                    toast.error('Impossible de supprimer - ce membre est assigné à des interventions');
                }
            } catch (error) {
                console.error('Erreur complète:', error);
                if (error.response) {
                    if (error.response.status === 500) {
                        toast.error('Erreur serveur: ' +
                            (error.response.data?.message || 'Veuillez contacter l\'administrateur'));
                    }
                } else {
                    toast.error('Erreur réseau ou serveur indisponible');
                }
            }
        }
    };

    const getSpecialite = (person) => {
        if (person.role === 'MEDECIN') {
            return person.specialiteMedecin || <span className="no-specialite">Non spécifiée</span>;
        } else if (person.role === 'ANESTHESISTE') {
            return person.specialiteAnesthesiste || <span className="no-specialite">Non spécifiée</span>;
        } else {
            return <span className="no-specialite">-</span>;
        }
    };

    const filteredStaff = staff.filter(person =>
        person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        UI_ROLES[person.role].toLowerCase().includes(searchTerm.toLowerCase()) ||
        (person.specialiteMedecin && person.specialiteMedecin.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (person.specialiteAnesthesiste && person.specialiteAnesthesiste.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement en cours...</p>
        </div>
    );

    return (
        <div className="medical-staff-container">
            <div className="medical-staff-header">
                <div>
                    <h2 className="medical-staff-title">Personnel Médical</h2>
                    <p className="staff-count">{filteredStaff.length} membres trouvés</p>
                </div>
                <div className="header-actions">
                    <Link to="/medical-staff/create" className="add-staff-btn">
                        + Ajouter un membre
                    </Link>
                </div>
            </div>
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Rechercher par nom, prénom, rôle ou spécialité"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="table-container">
                <table className="medical-staff-table">
                    <thead>
                    <tr>
                        <th>Image</th>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Rôle</th>
                        <th>Spécialité</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredStaff.length > 0 ? (
                        filteredStaff.map((person, index) => (
                            <tr key={person.id} style={{animationDelay: `${index * 0.05}s`}}>
                                <td>
                                    {person.image ? (
                                        <img
                                            src={person.image}
                                            alt={`${person.prenom} ${person.nom}`}
                                            className="staff-image"
                                            onError={(e) => {
                                                e.target.src = '/path/to/fallback-image.png';
                                            }}
                                        />
                                    ) : (
                                        <span className="no-image">Aucune image</span>
                                    )}
                                </td>
                                <td>{person.nom}</td>
                                <td>{person.prenom}</td>
                                <td>
                                    <span className={`role-badge role-${person.role.toLowerCase()}`}>
                                        {UI_ROLES[person.role] || person.role}
                                    </span>
                                </td>
                                <td>{getSpecialite(person)}</td>
                                <td className="action-cell">

                                    <button
                                        onClick={() => handleDelete(person.id)}
                                        className="delete-btn"
                                    >
                                        🗑️ Supprimer
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr className="no-results">
                            <td colSpan="6">Aucun résultat trouvé</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .medical-staff-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: 'Poppins', sans-serif;
                    background: #f8fafc;
                    min-height: 100vh;
                }

                .medical-staff-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1.5rem;
                }

                .medical-staff-title {
                    color: #2b2d42;
                    font-size: 2rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    position: relative;
                }

                .medical-staff-title::after {
                    content: '';
                    position: absolute;
                    bottom: -8px;
                    left: 0;
                    width: 60px;
                    height: 4px;
                    background: linear-gradient(90deg, #4361ee, #3a0ca3);
                    border-radius: 2px;
                }

                .staff-count {
                    color: #64748b;
                    font-size: 0.9rem;
                    margin: 0;
                }

                .header-actions {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .add-staff-btn {
                    padding: 0.75rem 1.5rem;
                    background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                    color: white;
                    text-decoration: none;
                    border-radius: 50px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                    font-size: 0.9rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    white-space: nowrap;
                }

                .add-staff-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 12px rgba(58, 12, 163, 0.2);
                }

                .add-staff-btn:active {
                    transform: translateY(0);
                }

                .search-container {
                    position: relative;
                    min-width: 300px;
                    flex-grow: 1;
                }

                .search-input {
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 50px;
                    width: 100%;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                }

                .search-input:focus {
                    outline: none;
                    border-color: #4361ee;
                    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
                }

                .table-container {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
                    overflow-x: auto;
                }

                .medical-staff-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
                    min-width: 900px;
                }

                .medical-staff-table thead {
                    background: linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%);
                    color: white;
                    position: sticky;
                    top: 0;
                }

                .medical-staff-table th {
                    padding: 1rem 1.5rem;
                    text-align: left;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                }

                .medical-staff-table tbody tr {
                    transition: all 0.3s ease;
                }

                .medical-staff-table tbody tr:not(:last-child) {
                    border-bottom: 1px solid #f0f0f0;
                }

                .medical-staff-table tbody tr:hover {
                    background-color: #f8f9ff;
                    transform: translateX(4px);
                }

                .medical-staff-table td {
                    padding: 1.2rem 1.5rem;
                    color: #4a4a4a;
                    font-weight: 400;
                    vertical-align: middle;
                }

                .staff-image {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 1px solid #e2e8f0;
                    display: block;
                }

                .no-image {
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 0.9em;
                }

                .no-specialite {
                    color: #94a3b8;
                    font-style: italic;
                    font-size: 0.9em;
                }

                .action-cell {
                    display: flex;
                    gap: 0.75rem;
                }

                .edit-btn {
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #4cc9f0 0%, #4895ef 100%);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                    text-decoration: none;
                }

                .edit-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(76, 201, 240, 0.3);
                }

                .delete-btn {
                    padding: 0.5rem 1rem;
                    background: linear-gradient(135deg, #f72585 0%, #b5179e 100%);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }

                .delete-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(247, 37, 133, 0.3);
                }

                .role-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 50px;
                    font-size: 0.8rem;
                    font-weight: 500;
                    display: inline-block;
                }

                .role-medecin {
                    background-color: #e3f2fd;
                    color: #1976d2;
                }

                .role-infirmier {
                    background-color: #e8f5e9;
                    color: #388e3c;
                }

                .role-anesthésiste {
                    background-color: #f3e5f5;
                    color: #8e24aa;
                }

                .no-results td {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                }

                .loading-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 300px;
                    gap: 1rem;
                }

                .loading-spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid #f0f0f0;
                    border-top: 4px solid #4361ee;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% {
                        transform: rotate(0deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .medical-staff-table tbody tr {
                    animation: fadeIn 0.5s ease forwards;
                }

                @media (max-width: 992px) {
                    .medical-staff-container {
                        padding: 1.5rem;
                    }

                    .search-container {
                        min-width: 100%;
                    }

                    .medical-staff-table th,
                    .medical-staff-table td {
                        padding: 1rem;
                    }

                    .staff-image {
                        width: 32px;
                        height: 32px;
                    }
                }

                @media (max-width: 768px) {
                    .medical-staff-header {
                        flex-direction: column;
                    }

                    .header-actions {
                        width: 100%;
                        flex-direction: column;
                    }

                    .add-staff-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .action-cell {
                        flex-direction: column;
                        gap: 0.5rem;
                    }

                    .medical-staff-table th,
                    .medical-staff-table td {
                        padding: 0.8rem;
                        font-size: 0.85rem;
                    }

                    .staff-image {
                        width: 28px;
                        height: 28px;
                    }
                }
            `}</style>
        </div>
    );
};

export default MedicalStaffList;
