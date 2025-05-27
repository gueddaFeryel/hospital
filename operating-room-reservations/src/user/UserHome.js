import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarAlt,
    faPlus,
    faList,
    faUserCircle,
    faSignOutAlt,
    faBell,
    faTimes,
    faFileMedical,
    faEdit
} from '@fortawesome/free-solid-svg-icons';
import UserCalendarView from './UserCalendarView';
import CreateReportForm from './CreateReportForm';
import './UserHome.css';
import { signOut } from "firebase/auth";
import { auth } from "../auth/firebase";
import { useAuth } from '../auth/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const UserHome = () => {
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isDoctor, setIsDoctor] = useState(false);
    const [selectedIntervention, setSelectedIntervention] = useState(null);
    const [showCreateReport, setShowCreateReport] = useState(false);
    const [editingReport, setEditingReport] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [reportForm, setReportForm] = useState({
        diagnostic: '',
        complications: '',
        recommandations: '',
        notesInfirmier: '',
        statut: 'BROUILLON'
    });
    const [existingReports, setExistingReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (userData?.role === 'MEDECIN') {
            setIsDoctor(true);
        }

        if (currentUser) {
            fetchNotifications();
            fetchExistingReports();
        }
    }, [currentUser, userData]);

    const fetchNotifications = async () => {
        try {
            const token = await currentUser.getIdToken();
            const response = await axios.get('http://localhost:8089/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` },
                params: { userId: currentUser.uid }
            });
            setNotifications(response.data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            toast.error("Erreur lors du chargement des notifications");
        }
    };

    const fetchExistingReports = async () => {
        try {
            setIsLoading(true);
            const token = await currentUser.getIdToken();
            const response = await axios.get('http://localhost:8089/api/rapports-postoperatoires/medecin', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-User-Id': userData.medicalStaffId,
                    'X-User-Role': userData.role
                }
            });
            setExistingReports(response.data);
        } catch (error) {
            console.error("Error fetching reports:", error);
            toast.error("Erreur lors du chargement des rapports");
        } finally {
            setIsLoading(false);
        }
    };

    const updatePostOperativeReport = async (reportId, updates) => {
        try {
            const token = await currentUser.getIdToken();

            // Remove notesInfirmier if user is a doctor
            const payload = isDoctor
                ? { ...updates, notesInfirmier: undefined }
                : updates;

            const response = await axios.put(
                `http://localhost:8089/api/rapports-postoperatoires/${reportId}`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-User-Role': userData.role,
                        'X-User-Id': userData.medicalStaffId,
                        'Content-Type': 'application/json'
                    }
                }
            );
            toast.success("Rapport mis à jour avec succès");
            return response.data;
        } catch (error) {
            handleApiError(error, "Erreur lors de la mise à jour du rapport");
            throw error;
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);

            // Prepare the updates object
            const updates = {
                diagnostic: reportForm.diagnostic,
                complications: reportForm.complications,
                recommandations: reportForm.recommandations,
                statut: reportForm.statut
            };

            await updatePostOperativeReport(editingReport.id, updates);
            await fetchExistingReports();
            setShowEditModal(false);
            resetReportForm();
        } catch (error) {
            console.error("Error updating report:", error);
            toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApiError = (error, defaultMessage) => {
        console.error("API Error:", error);
        let errorMessage = defaultMessage;

        if (error.response) {
            if (error.response.status === 400) {
                errorMessage = "Données invalides: " +
                    (error.response.data?.message || "Vérifiez tous les champs obligatoires");
            } else if (error.response.data?.message) {
                errorMessage = error.response.data.message;
            }
        }

        toast.error(errorMessage);
    };

    const resetReportForm = () => {
        setReportForm({
            diagnostic: '',
            complications: '',
            recommandations: '',
            notesInfirmier: '',
            statut: 'BROUILLON'
        });
        setEditingReport(null);
    };

    const handleEditReport = (report) => {
        setEditingReport(report);
        setReportForm({
            diagnostic: report.diagnostic || '',
            complications: report.complications || '',
            recommandations: report.recommandations || '',
            notesInfirmier: report.notesInfirmier || '',
            statut: report.statut || 'BROUILLON'
        });
        setShowEditModal(true);
    };

    const handleReportCreated = (newReport) => {
        setExistingReports(prev => [...prev, newReport]);
        setShowCreateReport(false);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Logout error:", error);
            toast.error("Une erreur est survenue lors de la déconnexion");
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            const token = await currentUser.getIdToken();
            await axios.patch(`http://localhost:8089/api/notifications/${notificationId}/read`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setNotifications(notifications.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const getDisplayName = () => {
        if (!currentUser && !userData) return "Chargement...";
        if (userData?.name) return userData.name;
        if (userData?.firstName || userData?.lastName) {
            return [userData.firstName, userData.lastName].filter(Boolean).join(' ');
        }
        return currentUser?.displayName || currentUser?.email?.split('@')[0] || "Utilisateur";
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (!currentUser || !userData) {
        return <div className="loading-container">Chargement...</div>;
    }

    return (
        <div className="user-app-container">
            <nav className="user-navbar">
                <div className="navbar-brand">
                    <FontAwesomeIcon icon={faCalendarAlt} className="brand-icon" />
                    <span>SGICH</span>
                </div>

                <div className="navbar-actions">
                    <button
                        className="notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <FontAwesomeIcon icon={faBell} />
                        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </button>

                    <div className="user-dropdown">
                        <button className="user-btn">
                            <FontAwesomeIcon icon={faUserCircle} />
                            <span>{getDisplayName()}</span>
                        </button>
                        <div className="dropdown-content">
                            <button onClick={handleLogout} className="logout-btn">
                                <FontAwesomeIcon icon={faSignOutAlt} />
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </div>

                {showNotifications && (
                    <div className="notifications-panel">
                        <div className="panel-header">
                            <h3>Notifications</h3>
                            <button onClick={() => setShowNotifications(false)}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="notifications-list">
                            {notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.read ? '' : 'unread'}`}
                                        onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                        <p>{notification.message}</p>
                                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                                    </div>
                                ))
                            ) : (
                                <p>Aucune notification</p>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            <main className="user-main-content">
                <div className="user-home">
                    <header className="page-header">
                        <h1>Mon Calendrier d'Interventions</h1>
                        <p>Bienvenue, {getDisplayName()}</p>
                    </header>

                    <div className="quick-actions-grid">
                        {isDoctor && (
                            <Link to="/request-intervention" className="action-card primary">
                                <div className="card-icon">
                                    <FontAwesomeIcon icon={faPlus} />
                                </div>
                                <h3>Demander une intervention</h3>
                                <p>Créer une nouvelle demande d'intervention chirurgicale</p>
                            </Link>
                        )}

                        <Link to="/mes-interventions" className="action-card secondary">
                            <div className="card-icon">
                                <FontAwesomeIcon icon={faList} />
                            </div>
                            <h3>Mes interventions</h3>
                            <p>Voir toutes vos interventions programmées</p>
                        </Link>
                    </div>


                    <section className="calendar-section">
                        <div className="section-header">
                            <h2>Vue Calendrier</h2>
                            {selectedIntervention && (
                                <div className="selected-intervention-info">
                                    <p>
                                        Intervention sélectionnée: #{selectedIntervention.id} -
                                        {selectedIntervention.patient?.name || 'Patient inconnu'} -
                                        Statut: {selectedIntervention.statut}
                                    </p>
                                    {selectedIntervention.statut === 'TERMINEE' && isDoctor && (
                                        <button
                                            onClick={() => setShowCreateReport(true)}
                                            className="create-report-btn"
                                        >
                                            <FontAwesomeIcon icon={faFileMedical} /> Créer rapport
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        <UserCalendarView
                            onInterventionSelect={setSelectedIntervention}
                            onReportSelect={handleEditReport}
                        />
                    </section>
                </div>
            </main>

            {showCreateReport && selectedIntervention && (
                <CreateReportForm
                    intervention={selectedIntervention}
                    onReportCreated={handleReportCreated}
                    onCancel={() => setShowCreateReport(false)}
                />
            )}

            {showEditModal && editingReport && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Modifier le rapport #{editingReport.id}</h3>
                        <button
                            className="close-modal"
                            onClick={() => setShowEditModal(false)}
                            disabled={isLoading}
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>

                        <form onSubmit={handleEditSubmit}>
                            <div className="form-group">
                                <label>Diagnostic *</label>
                                <textarea
                                    value={reportForm.diagnostic}
                                    onChange={(e) => setReportForm({...reportForm, diagnostic: e.target.value})}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Complications</label>
                                <textarea
                                    value={reportForm.complications}
                                    onChange={(e) => setReportForm({...reportForm, complications: e.target.value})}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label>Recommandations *</label>
                                <textarea
                                    value={reportForm.recommandations}
                                    onChange={(e) => setReportForm({...reportForm, recommandations: e.target.value})}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {isDoctor && (
                                <>
                                    <div className="form-group">
                                        <label>Statut *</label>
                                        <select
                                            value={reportForm.statut}
                                            onChange={(e) => setReportForm({...reportForm, statut: e.target.value})}
                                            required
                                            disabled={isLoading}
                                        >
                                            <option value="BROUILLON">Brouillon</option>
                                            <option value="SOUMIS">Soumis</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Notes infirmier</label>
                                        <textarea
                                            value={reportForm.notesInfirmier}
                                            onChange={(e) => setReportForm({...reportForm, notesInfirmier: e.target.value})}
                                            disabled={isLoading}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-buttons">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setShowEditModal(false)}
                                    disabled={isLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'En cours...' : 'Mettre à jour'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserHome;
