import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

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
                setStaff(response.data.filter(person =>
                    Object.keys(UI_ROLES).includes(person.role)
                ));
            } catch (error) {
                toast.error('Erreur de chargement');
            } finally {
                setLoading(false);
            }
        };
        fetchStaff();
    }, []);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:8089/api/medical-staff/${id}`);
            setStaff(staff.filter(person => person.id !== id));
            toast.success('Membre supprimé avec succès');
        } catch (error) {
            toast.error('Erreur lors de la suppression');
            console.error('Erreur:', error);
        }
    };

    const filteredStaff = staff.filter(person =>
        person.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        UI_ROLES[person.role].toLowerCase().includes(searchTerm.toLowerCase())
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
                <Link to="/dashboard" className="btn btn-back">
                    <i className="fas fa-arrow-left"></i> Retour au dashboard
                </Link>
                <div className="header-actions">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <i className="search-icon">🔍</i>
                    </div>

                </div>
            </div>

            <div className="table-container">
                <table className="medical-staff-table">
                    <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Prénom</th>
                        <th>Rôle</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredStaff.length > 0 ? (
                        filteredStaff.map((person, index) => (
                            <tr key={person.id} style={{ animationDelay: `${index * 0.05}s` }}>
                                <td>{person.nom}</td>
                                <td>{person.prenom}</td>
                                <td>
                                        <span className={`role-badge role-${person.role.toLowerCase()}`}>
                                            {UI_ROLES[person.role] || person.role}
                                        </span>
                                </td>
                                <td className="action-cell">
                                    <Link
                                        to={`/medical-staff/edit/${person.id}`}
                                        className="edit-btn"
                                    >
                                        ✏️ Modifier
                                    </Link>
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
                            <td colSpan="4">Aucun résultat trouvé</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            <style jsx>{`
                .medical-staff-container {
                    padding: 2rem;
                    max-width: 1200px;
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

                .search-container {
                    position: relative;
                    min-width: 250px;
                }

                .search-input {
                    padding: 0.75rem 1rem 0.75rem 2.5rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 50px;
                    width: 100%;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                }

                .search-input:focus {
                    outline: none;
                    border-color: #4361ee;
                    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
                }

                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #64748b;
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

                .table-container {
                    background: white;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
                }

                .medical-staff-table {
                    width: 100%;
                    border-collapse: separate;
                    border-spacing: 0;
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
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .medical-staff-table tbody tr {
                    animation: fadeIn 0.5s ease forwards;
                }

                @media (max-width: 768px) {
                    .medical-staff-container {
                        padding: 1rem;
                    }
                
                    .medical-staff-header {
                        flex-direction: column;
                    }
                    
                    .header-actions {
                        width: 100%;
                        flex-direction: column;
                    }
                    
                    .search-container {
                        width: 100%;
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
                        padding: 0.75rem;
                        font-size: 0.85rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default MedicalStaffList;
