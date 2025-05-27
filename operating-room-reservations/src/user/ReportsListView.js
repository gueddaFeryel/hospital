import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileMedical,
    faSync,
    faEdit,
    faEye,
    faHospital,
    faSearch,
    faTimes
} from '@fortawesome/free-solid-svg-icons';
import './ReportsListView.css';

const ReportsListView = () => {
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [staffId, setStaffId] = useState(null);
    const [showRapportForm, setShowRapportForm] = useState(false);
    const [selectedRapport, setSelectedRapport] = useState(null);
    const [rapportForm, setRapportForm] = useState({
        diagnostic: '',
        complications: '',
        recommandations: '',
        notesInfirmier: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const fetchUserDetails = useCallback(async () => {
        try {
            if (!currentUser?.uid) {
                setError("Utilisateur non authentifié");
                setLoading(false);
                return;
            }

            const staffResponse = await axios.get(
                `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
            );
            const fetchedStaffId = staffResponse.data?.id;
            const fetchedStaffRole = staffResponse.data?.role;

            if (!fetchedStaffId || !fetchedStaffRole) {
                setError("Personnel médical non trouvé");
                setLoading(false);
                return;
            }

            setStaffId(fetchedStaffId);
            setUserRole(fetchedStaffRole);
        } catch (err) {
            console.error("Erreur lors de la récupération des détails de l'utilisateur:", err);
            setError(err.response?.data?.message || "Erreur lors de la récupération des détails de l'utilisateur");
            setLoading(false);
        }
    }, [currentUser]);

    const fetchReports = useCallback(async () => {
        if (!staffId) return;
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:8089/api/rapports-postoperatoires/by-staff/${staffId}`,
                {
                    headers: {
                        'X-User-Id': staffId,
                        'X-User-Role': userRole
                    }
                }
            );
            setReports(response.data);
            setFilteredReports(response.data);
        } catch (err) {
            console.error("Erreur lors de la récupération des rapports:", err);
            if (err.response?.status === 404) {
                setReports([]);
                setFilteredReports([]);
                setError("Aucun rapport trouvé pour votre profil");
            } else {
                setError(err.response?.data?.message || "Erreur lors de la récupération des rapports");
            }
        } finally {
            setLoading(false);
        }
    }, [staffId, userRole]);

    useEffect(() => {
        fetchUserDetails();
    }, [fetchUserDetails]);

    useEffect(() => {
        if (staffId) {
            fetchReports();
            const refreshInterval = setInterval(fetchReports, 30000);
            return () => clearInterval(refreshInterval);
        }
    }, [staffId, fetchReports]);

    useEffect(() => {
        const filtered = reports.filter(report =>
            [
                report.diagnostic || '',
                report.complications || '',
                report.recommandations || '',
                report.notesInfirmier || '',
                report.statut || ''
            ].some(field =>
                field.toLowerCase().includes(searchQuery.toLowerCase())
            )
        );
        setFilteredReports(filtered);
    }, [searchQuery, reports]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const clearSearch = () => {
        setSearchQuery('');
    };

    const handleOpenRapportForm = (rapport) => {
        setSelectedRapport(rapport);
        setRapportForm({
            diagnostic: rapport.diagnostic || '',
            complications: rapport.complications || '',
            recommandations: rapport.recommandations || '',
            notesInfirmier: rapport.notesInfirmier || ''
        });
        setShowRapportForm(true);
    };

    const handleCloseRapportForm = () => {
        setShowRapportForm(false);
        setSelectedRapport(null);
    };

    const handleRapportInputChange = (e) => {
        const { name, value } = e.target;
        setRapportForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateRapport = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            if (!selectedRapport || selectedRapport.statut !== 'BROUILLON') {
                throw new Error("Le rapport n'est pas en statut brouillon et ne peut pas être modifié");
            }
            const creationDate = new Date(selectedRapport.dateCreation).getTime();
            if (creationDate < Date.now() - 24 * 60 * 60 * 1000) {
                throw new Error("Le rapport ne peut pas être modifié après 24 heures");
            }

            let url = `http://localhost:8089/api/rapports-postoperatoires/${selectedRapport.id}`;
            let payload = {};
            let headers = {
                'Content-Type': 'application/json',
                'X-User-Id': staffId,
                'X-User-Role': userRole
            };

            if (userRole === 'MEDECIN') {
                if (!rapportForm.diagnostic.trim() || !rapportForm.recommandations.trim()) {
                    throw new Error("Le diagnostic et les recommandations sont requis");
                }
                payload = {
                    diagnostic: rapportForm.diagnostic,
                    complications: rapportForm.complications || null,
                    recommandations: rapportForm.recommandations,
                    statut: selectedRapport.statut
                };
            } else if (userRole === 'INFIRMIER') {
                if (!rapportForm.notesInfirmier.trim()) {
                    throw new Error("Les notes infirmier sont requises et ne peuvent pas être vides");
                }
                url = `${url}/notes-infirmier`;
                payload = {
                    notesInfirmier: rapportForm.notesInfirmier
                };
            } else {
                throw new Error("Rôle utilisateur invalide");
            }

            const response = await axios.put(url, payload, { headers });

            setReports(prev =>
                prev.map(r => (r.id === response.data.id ? response.data : r))
            );
            setFilteredReports(prev =>
                prev.map(r => (r.id === response.data.id ? response.data : r))
            );
            setShowRapportForm(false);
            alert('Rapport mis à jour avec succès!');
        } catch (err) {
            console.error("Erreur lors de la mise à jour du rapport:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du rapport';
            alert(`Erreur: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const canEditRapport = (rapport) => {
        return rapport.statut === 'BROUILLON' &&
            new Date(rapport.dateCreation).getTime() > Date.now() - 24 * 60 * 60 * 1000;
    };

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des rapports...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-alert">
                <h3>Erreur</h3>
                <p>{error}</p>
                <button onClick={() => { fetchUserDetails(); fetchReports(); }} className="retry-btn">
                    Réessayer
                </button>
            </div>
        </div>
    );

    return (
        <div className="reports-list-container">
            <header className="reports-header">
                <div className="header-content">
                    <div className="title-section">
                        <FontAwesomeIcon icon={faHospital} className="header-icon" />
                        <h1>Mes Rapports Postopératoires</h1>
                    </div>
                    <div className="header-actions">
                        <div className="search-container">
                            <FontAwesomeIcon icon={faSearch} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Rechercher dans les rapports..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="search-input"
                            />
                            {searchQuery && (
                                <button onClick={clearSearch} className="clear-search-btn">
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            )}
                        </div>
                        <button onClick={fetchReports} className="refresh-btn">
                            <FontAwesomeIcon icon={faSync} />
                            <span>Actualiser</span>
                        </button>
                    </div>
                </div>
                <p className="subtitle">Liste des rapports associés à votre profil</p>
            </header>

            <main className="reports-content">
                {filteredReports.length > 0 ? (
                    <div className="reports-table">
                        <table>
                            <thead>
                            <tr>
                                <th>Intervention</th>
                                <th>Diagnostic</th>
                                <th>Complications</th>
                                <th>Recommandations</th>
                                <th className={userRole === 'INFIRMIER' ? 'highlight' : ''}>
                                    Notes Infirmier
                                </th>
                                <th>Statut</th>
                                <th>Date Création</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredReports.map(report => (
                                <tr key={report.id}>
                                    <td>
                                        <a
                                            href={`/intervention-details/${report.intervention?.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                navigate(`/intervention-details/${report.intervention?.id}`);
                                            }}
                                        >
                                            {report.intervention?.id || 'Non spécifié'}
                                        </a>
                                    </td>
                                    <td>{report.diagnostic || 'Non renseigné'}</td>
                                    <td>{report.complications || 'Aucune'}</td>
                                    <td>{report.recommandations || 'Non renseigné'}</td>
                                    <td className={userRole === 'INFIRMIER' ? 'highlight' : ''}>
                                        {report.notesInfirmier || 'Aucune'}
                                    </td>
                                    <td>
                                            <span className={`status-badge status-${report.statut.toLowerCase()}`}>
                                                {report.statut}
                                            </span>
                                    </td>
                                    <td>
                                        {format(parseISO(report.dateCreation), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                    </td>
                                    <td>
                                        {canEditRapport(report) ? (
                                            <button
                                                onClick={() => handleOpenRapportForm(report)}
                                                className="action-btn edit"
                                                title="Modifier"
                                            >
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleOpenRapportForm(report)}
                                                className="action-btn view"
                                                title="Voir"
                                                disabled={userRole === 'INFIRMIER' && !report.notesInfirmier}
                                            >
                                                <FontAwesomeIcon icon={faEye} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="no-reports">
                        <FontAwesomeIcon icon={faFileMedical} size="3x" />
                        <h3>{searchQuery ? 'Aucun résultat trouvé' : 'Aucun rapport trouvé'}</h3>
                        <p>
                            {searchQuery
                                ? 'Aucun rapport ne correspond à votre recherche.'
                                : 'Vous n\'avez pas de rapports postopératoires associés.'}
                        </p>
                    </div>
                )}
            </main>

            {showRapportForm && selectedRapport && (
                <div className="rapport-form-modal">
                    <div className="modal-content">
                        <button onClick={handleCloseRapportForm} className="close-modal">×</button>
                        <div className="modal-header">
                            <h2>
                                <FontAwesomeIcon icon={faFileMedical} />
                                {canEditRapport(selectedRapport) ? 'Modifier le rapport' : 'Voir le rapport'}
                            </h2>
                        </div>
                        <div className="modal-body">
                            <form>
                                {userRole === 'MEDECIN' && (
                                    <>
                                        <div className="form-group">
                                            <label>Diagnostic*</label>
                                            <textarea
                                                name="diagnostic"
                                                value={rapportForm.diagnostic}
                                                onChange={handleRapportInputChange}
                                                required
                                                rows="3"
                                                disabled={!canEditRapport(selectedRapport)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Complications</label>
                                            <textarea
                                                name="complications"
                                                value={rapportForm.complications}
                                                onChange={handleRapportInputChange}
                                                rows="2"
                                                disabled={!canEditRapport(selectedRapport)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Recommandations*</label>
                                            <textarea
                                                name="recommandations"
                                                value={rapportForm.recommandations}
                                                onChange={handleRapportInputChange}
                                                required
                                                rows="3"
                                                disabled={!canEditRapport(selectedRapport)}
                                            />
                                        </div>
                                    </>
                                )}
                                {userRole === 'INFIRMIER' && (
                                    <div className="form-group">
                                        <label>Notes Infirmier*</label>
                                        <textarea
                                            name="notesInfirmier"
                                            value={rapportForm.notesInfirmier}
                                            onChange={handleRapportInputChange}
                                            required
                                            rows="3"
                                            disabled={!canEditRapport(selectedRapport)}
                                        />
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="modal-footer">
                            {canEditRapport(selectedRapport) && (
                                <button
                                    onClick={handleUpdateRapport}
                                    className="btn-save-rapport"
                                    disabled={isSubmitting}
                                >
                                    <FontAwesomeIcon icon={faFileMedical} />
                                    {isSubmitting ? 'Enregistrement...' : 'Mettre à jour'}
                                </button>
                            )}
                            <button
                                onClick={handleCloseRapportForm}
                                className="btn-cancel-rapport"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsListView;
