import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { format, parseISO, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserMd,
    faProcedures,
    faCalendarCheck,
    faSync,
    faChevronRight,
    faHospital,
    faClock,
    faUsers,
    faNotesMedical,
    faUserCircle,
    faPhone,
    faEnvelope,
    faCalendarAlt,
    faFileMedical,
    faPlus,
    faCheck,
    faList,
    faBell,
    faCalendarPlus,
    faEdit,
    faTimesCircle,
    faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import './UserCalendarView.css';

const UserCalendarView = () => {
    const [interventions, setInterventions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [date, setDate] = useState(new Date());
    const [selectedInterventions, setSelectedInterventions] = useState([]);
    const [selectedIntervention, setSelectedIntervention] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showRapportForm, setShowRapportForm] = useState(false);
    const [rapport, setRapport] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [rapportForm, setRapportForm] = useState({
        diagnostic: '',
        complications: '',
        recommandations: '',
        notesInfirmier: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState('all'); // 'all' ou 'unread'
    const { currentUser } = useAuth();
    const isMenuOpen = useRef(false);

    const fetchInterventions = useCallback(async () => {
        try {
            if (!currentUser?.uid) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }

            setLoading(true);

            const staffResponse = await axios.get(`http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`);
            const staffId = staffResponse.data?.id;
            const staffRole = staffResponse.data?.role;

            if (!staffId) {
                setInterventions([]);
                setLoading(false);
                return;
            }

            setUserRole(staffRole);

            const interventionsResponse = await axios.get(`http://localhost:8089/api/interventions/by-staff/${staffId}`);

            const formattedInterventions = interventionsResponse.data.map(intervention => ({
                ...intervention,
                date: intervention.date ? parseISO(intervention.date) : null,
                startTime: intervention.startTime ? parseISO(intervention.startTime) : null,
                endTime: intervention.endTime ? parseISO(intervention.endTime) : null
            }));

            setInterventions(formattedInterventions);
        } catch (err) {
            console.error("Error fetching interventions:", err);
            setError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    const fetchNotifications = useCallback(async () => {
        console.log('fetchNotifications called at:', new Date().toISOString());
        try {
            if (!currentUser?.uid) {
                console.error("No currentUser.uid");
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            const staffResponse = await axios.get(
                `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
            );
            const staffId = staffResponse.data?.id;
            console.log('Staff response:', staffResponse.data);

            if (!staffId) {
                console.error("No staffId found");
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            const response = await axios.get(
                `http://localhost:8082/api/notifications/user/${staffId.toString()}`
            );
            console.log('Notifications response:', response.data);

            const formattedNotifications = response.data.map(notification => ({
                id: notification.id,
                userId: notification.userId,
                interventionId: notification.interventionId?.toString(),
                type: notification.type || 'INFO',
                title: notification.title || 'Notification',
                message: notification.message,
                read: notification.read === true,
                timestamp: notification.timestamp
                    ? typeof notification.timestamp === 'object' && notification.timestamp.seconds
                        ? new Date(notification.timestamp.seconds * 1000).toISOString()
                        : new Date(notification.timestamp).toISOString()
                    : new Date().toISOString()
            }));

            console.log('Formatted notifications:', formattedNotifications);
            console.log('Notification types:', formattedNotifications.map(n => n.type));
            setNotifications(formattedNotifications);
            setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        } catch (err) {
            console.error("Error fetching notifications:", err.response?.data || err.message);
            setUnreadCount(0);
        }
    }, [currentUser]);

    const markNotificationsAsRead = useCallback(async () => {
        console.log('markNotificationsAsRead called at:', new Date().toISOString());
        try {
            const staffResponse = await axios.get(
                `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
            );
            const staffId = staffResponse.data?.id;

            if (staffId) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                setNotificationFilter('all');
                await axios.post(
                    `http://localhost:8082/api/notifications/mark-all-read`,
                    null,
                    {
                        params: { userId: staffId },
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
                console.log('Notifications marked as read, fetching new notifications');
                await fetchNotifications();
            }
        } catch (err) {
            console.error("Error marking all as read:", err);
            await fetchNotifications();
        }
    }, [currentUser, fetchNotifications]);

    const fetchRapport = async (interventionId) => {
        try {
            const response = await axios.get(`http://localhost:8089/api/rapports-postoperatoires/intervention/${interventionId}`);
            if (response.data) {
                setRapport(response.data);
                setRapportForm({
                    diagnostic: response.data.diagnostic || '',
                    complications: response.data.complications || '',
                    recommandations: response.data.recommandations || '',
                    notesInfirmier: response.data.notesInfirmier || ''
                });
            } else {
                setRapport(null);
                setRapportForm({
                    diagnostic: '',
                    complications: '',
                    recommandations: '',
                    notesInfirmier: ''
                });
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setRapport(null);
            } else {
                console.error("Error fetching rapport:", err);
            }
        }
    };

    useEffect(() => {
        console.log('Current user:', currentUser);
        fetchInterventions();
        fetchNotifications();

        const refreshInterval = setInterval(() => {
            fetchInterventions();
            fetchNotifications();
        }, 30000);

        return () => clearInterval(refreshInterval);
    }, [fetchInterventions, fetchNotifications, currentUser]);

    useEffect(() => {
        let ignoreNextClick = false;

        const handleClickOutside = (event) => {
            console.log('Click detected on:', event.target, 'at:', new Date().toISOString());
            const dropdown = document.querySelector('.notifications-dropdown');
            const notificationBtn = document.querySelector('.notification-btn');

            if (ignoreNextClick) {
                ignoreNextClick = false;
                return;
            }

            if (
                showNotifications &&
                dropdown &&
                !dropdown.contains(event.target) &&
                notificationBtn &&
                !notificationBtn.contains(event.target)
            ) {
                console.log('Closing notifications due to click outside at:', new Date().toISOString());
                setShowNotifications(false);
                isMenuOpen.current = false;
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        if (showNotifications) {
            ignoreNextClick = true;
            setTimeout(() => {
                ignoreNextClick = false;
            }, 1000);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

    useEffect(() => {
        console.log(
            'showNotifications changed:',
            showNotifications,
            'isMenuOpen:',
            isMenuOpen.current,
            'notifications length:',
            notifications.length,
            'unreadCount:',
            unreadCount,
            'notificationFilter:',
            notificationFilter
        );
    }, [showNotifications, notifications, unreadCount, notificationFilter]);

    useEffect(() => {
        const filtered = interventions.filter(intervention => {
            if (!intervention.date) return false;
            return isSameDay(intervention.date, date);
        });
        setSelectedInterventions(filtered);
    }, [date, interventions]);

    const handleDateChange = (newDate) => {
        setDate(newDate);
        setShowDetails(false);
        setShowRapportForm(false);
    };

    const handleSelectIntervention = (intervention) => {
        setSelectedIntervention(intervention);
        setShowDetails(true);
        fetchRapport(intervention.id);
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setShowRapportForm(false);
    };

    const handleOpenRapportForm = () => {
        setShowRapportForm(true);
    };

    const handleCloseRapportForm = () => {
        setShowRapportForm(false);
    };

    const handleRapportInputChange = (e) => {
        const { name, value } = e.target;
        setRapportForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateRapport = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const staffResponse = await axios.get(
                `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
            );
            const staffId = staffResponse.data?.id;
            const staffRole = staffResponse.data?.role;

            if (!staffId || !staffRole) {
                throw new Error("Medical staff ID or role not found");
            }

            if (staffRole !== 'MEDECIN') {
                throw new Error("Only doctors can create postoperative reports");
            }

            const rapportData = {
                diagnostic: rapportForm.diagnostic,
                complications: rapportForm.complications || null,
                recommandations: rapportForm.recommandations,
                notesInfirmier: null,
                statut: "BROUILLON"
            };

            const response = await axios.post(
                `http://localhost:8089/api/rapports-postoperatoires/intervention/${selectedIntervention.id}`,
                rapportData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Id': staffId,
                        'X-User-Role': staffRole
                    }
                }
            );

            setRapport(response.data);
            setShowRapportForm(false);
            alert('Rapport créé avec succès!');
        } catch (err) {
            console.error("Error creating rapport:", err);
            alert(`Erreur: ${err.response?.data?.message || err.message || 'Erreur lors de la création du rapport'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRapport = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const staffResponse = await axios.get(
                `http://localhost:8089/api/medical-staff/by-firebase/${currentUser.uid}`
            );
            const staffId = staffResponse.data?.id;
            const staffRole = staffResponse.data?.role;

            if (!staffId || !staffRole) {
                throw new Error("Medical staff ID or role not found");
            }

            if (!rapport || rapport.statut !== 'BROUILLON') {
                throw new Error("Report is not in draft status and cannot be updated");
            }
            const creationDate = new Date(rapport.dateCreation).getTime();
            if (creationDate < Date.now() - 24 * 60 * 60 * 1000) {
                throw new Error("Report cannot be updated after 24 hours");
            }

            let url = `http://localhost:8089/api/rapports-postoperatoires/${rapport.id}`;
            let payload = {};
            let headers = {
                'Content-Type': 'application/json',
                'X-User-Id': staffId,
                'X-User-Role': staffRole
            };

            if (staffRole === 'MEDECIN') {
                if (!rapportForm.diagnostic.trim() || !rapportForm.recommandations.trim()) {
                    throw new Error("Diagnostic and recommandations are required");
                }
                payload = {
                    diagnostic: rapportForm.diagnostic,
                    complications: rapportForm.complications || null,
                    recommandations: rapportForm.recommandations,
                    statut: rapport.statut
                };
            } else if (staffRole === 'INFIRMIER') {
                if (!rapportForm.notesInfirmier.trim()) {
                    throw new Error("Notes infirmier are required and cannot be empty");
                }
                url = `${url}/notes-infirmier`;
                payload = {
                    notesInfirmier: rapportForm.notesInfirmier
                };
            } else {
                throw new Error("Invalid user role");
            }

            const response = await axios.put(url, payload, { headers });

            setRapport(response.data);
            setShowRapportForm(false);
            alert('Rapport mis à jour avec succès!');
        } catch (err) {
            console.error("Error updating rapport:", err);
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Erreur lors de la mise à jour du rapport';
            alert(`Erreur: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'INTERVENTION_CREATED':
                return <FontAwesomeIcon icon={faCalendarPlus} />;
            case 'INTERVENTION_UPDATED':
            case 'INTERVENTION_MODIFIED':
                return <FontAwesomeIcon icon={faEdit} />;
            case 'INTERVENTION_CANCELLED':
                return <FontAwesomeIcon icon={faTimesCircle} />;
            case 'REMINDER_24H':
                return <FontAwesomeIcon icon={faClock} />;
            default:
                return <FontAwesomeIcon icon={faInfoCircle} />;
        }
    };

    const handleNotificationClick = (notification, event) => {
        event.stopPropagation();
        try {
            if (notification.interventionId) {
                const intervention = interventions.find(i => i.id.toString() === notification.interventionId.toString());
                if (intervention) {
                    setSelectedIntervention(intervention);
                    setShowDetails(true);
                    fetchRapport(intervention.id);
                    setShowNotifications(false);
                    isMenuOpen.current = false;
                }
            }
        } catch (err) {
            console.error("Error handling notification click:", err);
        }
    };

    const toggleNotifications = (event) => {
        event.stopPropagation();
        setShowNotifications(prev => {
            const newState = !prev;
            isMenuOpen.current = newState;
            console.log('Toggling notifications, new state:', newState, 'at:', new Date().toISOString());

            return newState;
        });
    };

    const handleFilterChange = (filter) => {
        setNotificationFilter(filter);
        console.log('Notification filter changed to:', filter);
    };

    const filteredNotifications = notificationFilter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications;

    const tileContent = ({ date, view }) => {
        if (view !== 'month') return null;

        const dayInterventions = interventions.filter(intervention =>
            intervention.date && isSameDay(intervention.date, date)
        ).slice(0, 3);

        return (
            <div className="day-interventions">
                {dayInterventions.map((intervention, index) => {
                    let icon = faCalendarCheck;
                    let color = 'var(--primary-color)';

                    switch (intervention.type) {
                        case 'CHIRURGIE':
                            icon = faProcedures;
                            color = 'var(--danger-color)';
                            break;
                        case 'CONSULTATION':
                            icon = faUserMd;
                            color = 'var(--success-color)';
                            break;
                        default:
                            break;
                    }

                    return (
                        <div key={index} className="intervention-marker" style={{ color }}>
                            <FontAwesomeIcon icon={icon} />
                        </div>
                    );
                })}
                {dayInterventions.length > 3 && (
                    <div className="more-interventions">+{dayInterventions.length - 3}</div>
                )}
            </div>
        );
    };

    const canEditRapport = rapport && rapport.statut === 'BROUILLON' &&
        new Date(rapport.dateCreation).getTime() > Date.now() - 24 * 60 * 60 * 1000;

    if (loading) return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Chargement des interventions...</p>
        </div>
    );

    if (error) return (
        <div className="error-container">
            <div className="error-alert">
                <h3>Erreur</h3>
                <p>{error}</p>
                <button onClick={fetchInterventions} className="retry-btn">
                    Réessayer
                </button>
            </div>
        </div>
    );

    return (
        <div className="modern-calendar-container">
            <header className="calendar-header">
                <div className="header-content">
                    <div className="title-section">
                        <FontAwesomeIcon icon={faHospital} className="header-icon" />
                        <h1>Mon Calendrier Médical</h1>
                    </div>
                    <div className="header-actions">
                        <Link to="/reports" className="reports-btn">
                            <FontAwesomeIcon icon={faList} />
                            <span>Mes Rapports</span>
                        </Link>
                        <button onClick={fetchInterventions} className="refresh-btn">
                            <FontAwesomeIcon icon={faSync} />
                            <span>Actualiser</span>
                        </button>
                        <div className="notifications-container">
                            <button
                                onClick={toggleNotifications}
                                className="notification-btn"
                            >
                                <FontAwesomeIcon icon={faBell} />
                                {unreadCount > 0 && (
                                    <span className="notification-badge">{unreadCount}</span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="notifications-dropdown">
                                    <div className="notifications-header">
                                        <h4>Vos Notifications</h4>
                                        <div className="notification-filters">
                                            <button
                                                className={`filter-btn ${notificationFilter === 'all' ? 'active' : ''}`}
                                                onClick={() => handleFilterChange('all')}
                                            >
                                                Toutes
                                            </button>
                                            <button
                                                className={`filter-btn ${notificationFilter === 'unread' ? 'active' : ''}`}
                                                onClick={() => handleFilterChange('unread')}
                                            >
                                                Non lues
                                            </button>
                                        </div>
                                    </div>
                                    <div className="notifications-actions">
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={markNotificationsAsRead}
                                                className="mark-read-btn"
                                            >
                                                Marquer tout comme lu
                                            </button>
                                        )}
                                    </div>
                                    <div className="notifications-list">
                                        {filteredNotifications.length > 0 ? (
                                            filteredNotifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.type === 'REMINDER_24H' ? 'reminder' : ''}`}
                                                    onClick={(e) => handleNotificationClick(notification, e)}
                                                >
                                                    <div className="notification-type">
                                                        {getNotificationIcon(notification.type)}
                                                        {!notification.read && <span className="unread-dot"></span>}
                                                    </div>
                                                    <div className="notification-content">
                                                        <h5>{notification.title}</h5>
                                                        <p>{notification.message}</p>
                                                        <small>
                                                            {format(new Date(notification.timestamp), 'dd/MM/yyyy HH:mm')}
                                                        </small>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="no-notifications">
                                                Aucune notification pour le moment
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <p className="subtitle">Visualisation des interventions programmées</p>
            </header>

            <main className="calendar-content">
                <div className="calendar-section">
                    <div className="calendar-wrapper">
                        <Calendar
                            onChange={handleDateChange}
                            value={date}
                            locale="fr-FR"
                            tileContent={tileContent}
                            className="modern-calendar"
                            navigationLabel={({ date }) => format(date, 'MMMM yyyy', { locale: fr })}
                        />
                    </div>

                    <div className="calendar-legend">
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: 'var(--success-color)' }}>
                                <FontAwesomeIcon icon={faUserMd} />
                            </div>
                            <span>Consultation</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: 'var(--danger-color)' }}>
                                <FontAwesomeIcon icon={faProcedures} />
                            </div>
                            <span>Chirurgie</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-marker" style={{ backgroundColor: 'var(--primary-color)' }}>
                                <FontAwesomeIcon icon={faCalendarCheck} />
                            </div>
                            <span>Autre intervention</span>
                        </div>
                    </div>
                </div>

                <div className="interventions-section">
                    <div className="section-header">
                        <h2>Interventions pour le {format(date, 'EEEE d MMMM yyyy', { locale: fr })}</h2>
                        <span className="interventions-count">{selectedInterventions.length}</span>
                    </div>

                    {selectedInterventions.length > 0 ? (
                        <div className="interventions-grid">
                            {selectedInterventions.map(intervention => (
                                <div key={intervention.id} className="intervention-card">
                                    <div className="card-header">
                                        <div className={`type-badge type-${intervention.type.toLowerCase()}`}>
                                            {intervention.type.replace(/_/g, ' ')}
                                        </div>
                                        <div className={`status-badge status-${intervention.statut.toLowerCase()}`}>
                                            {intervention.statut.toLowerCase()}
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="info-row">
                                            <span className="info-label">Salle:</span>
                                            <span className="info-value">{intervention.room?.name || 'Non attribuée'}</span>
                                        </div>
                                        {intervention.startTime && (
                                            <div className="info-row">
                                                <span className="info-label">Horaire:</span>
                                                <span className="info-value">
                                                    {format(intervention.startTime, 'HH:mm')} - {intervention.endTime ? format(intervention.endTime, 'HH:mm') : '?'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleSelectIntervention(intervention)}
                                        className="details-btn"
                                    >
                                        <span>Voir détails</span>
                                        <FontAwesomeIcon icon={faChevronRight} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-interventions">
                            <img src="/images/empty-calendar.svg" alt="Aucune intervention" />
                            <h3>Aucune intervention programmée</h3>
                            <p>Vous n'avez pas d'intervention prévue pour cette journée</p>
                        </div>
                    )}
                </div>
            </main>

            {showDetails && selectedIntervention && (
                <div className="details-modal">
                    <div className="modal-content">
                        <button onClick={handleCloseDetails} className="close-modal">×</button>

                        <div className="modal-header">
                            <h2>
                                {selectedIntervention.type.replace(/_/g, ' ')}
                                <span className={`status-badge status-${selectedIntervention.statut.toLowerCase()}`}>
                                    {selectedIntervention.statut.toLowerCase()}
                                </span>
                            </h2>
                        </div>

                        <div className="modal-body">
                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faCalendarAlt} /> Informations générales</h3>
                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">Date:</span>
                                        <span className="detail-value">
                                            {format(selectedIntervention.date, 'EEEE d MMMM yyyy', { locale: fr })}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Horaire:</span>
                                        <span className="detail-value">
                                            {selectedIntervention.startTime ?
                                                `${format(selectedIntervention.startTime, 'HH:mm')} - ${selectedIntervention.endTime ? format(selectedIntervention.endTime, 'HH:mm') : '?'}` :
                                                'Non spécifié'}
                                        </span>
                                    </div>
                                </div>
                                <div className="detail-row">
                                    <div className="detail-item">
                                        <span className="detail-label">Salle:</span>
                                        <span className="detail-value">
                                            {selectedIntervention.room ? (
                                                <div className="room-details">
                                                    <span className="room-name">{selectedIntervention.room.name}</span>
                                                    {selectedIntervention.room.equipment && (
                                                        <span className="room-equipment">{selectedIntervention.room.equipment}</span>
                                                    )}
                                                </div>
                                            ) : 'Non attribuée'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faUsers} /> Équipe médicale</h3>
                                {selectedIntervention.equipeMedicale?.length > 0 ? (
                                    <div className="team-grid">
                                        {selectedIntervention.equipeMedicale.map(member => (
                                            <div key={`${member.role}-${member.id}`} className="team-member">
                                                <div className="member-role">{member.role}</div>
                                                <div className="member-info">
                                                    <FontAwesomeIcon icon={faUserCircle} />
                                                    <span className="member-name">{member.nom} {member.prenom}</span>
                                                </div>
                                                {member.telephone && (
                                                    <div className="member-contact">
                                                        <FontAwesomeIcon icon={faPhone} />
                                                        <span>{member.telephone}</span>
                                                    </div>
                                                )}
                                                {member.email && (
                                                    <div className="member-contact">
                                                        <FontAwesomeIcon icon={faEnvelope} />
                                                        <span>{member.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-team">Aucun membre assigné à cette intervention</p>
                                )}
                            </div>

                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faNotesMedical} /> Notes supplémentaires</h3>
                                <div className="notes-content">
                                    {selectedIntervention.notes || "Aucune note ajoutée"}
                                </div>
                            </div>

                            <div className="details-section">
                                <h3><FontAwesomeIcon icon={faFileMedical} /> Rapport Postopératoire</h3>
                                {rapport ? (
                                    <div className="rapport-content">
                                        <div className="rapport-field">
                                            <label>Diagnostic:</label>
                                            <div className="rapport-value">{rapport.diagnostic || 'Non renseigné'}</div>
                                        </div>
                                        <div className="rapport-field">
                                            <label>Complications:</label>
                                            <div className="rapport-value">{rapport.complications || 'Aucune complication'}</div>
                                        </div>
                                        <div className="rapport-field">
                                            <label>Recommandations:</label>
                                            <div className="rapport-value">{rapport.recommandations || 'Non renseigné'}</div>
                                        </div>
                                        <div className="rapport-field">
                                            <label>Notes Infirmier:</label>
                                            <div className="rapport-value">{rapport.notesInfirmier || 'Aucune note'}</div>
                                        </div>
                                        <div className="rapport-status">
                                            <span className={`status-badge status-${rapport.statut.toLowerCase()}`}>
                                                {rapport.statut}
                                            </span>
                                            <span className="rapport-date">
                                                Créé le {format(parseISO(rapport.dateCreation), 'dd/MM/yyyy HH:mm')}
                                            </span>
                                        </div>
                                        {canEditRapport && (
                                            <button
                                                onClick={handleOpenRapportForm}
                                                className="btn-edit-rapport"
                                            >
                                                Modifier le rapport
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="no-rapport">
                                        <p>Aucun rapport postopératoire n'a été créé pour cette intervention.</p>
                                        {selectedIntervention.statut === 'TERMINEE' && userRole === 'MEDECIN' && (
                                            <button
                                                onClick={handleOpenRapportForm}
                                                className="btn-create-rapport"
                                            >
                                                <FontAwesomeIcon icon={faPlus} /> Créer un rapport
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRapportForm && selectedIntervention && (
                <div className="rapport-form-modal">
                    <div className="modal-content">
                        <button onClick={handleCloseRapportForm} className="close-modal">×</button>

                        <div className="modal-header">
                            <h2>
                                <FontAwesomeIcon icon={faFileMedical} />
                                {rapport ? 'Modifier le rapport' : 'Créer un rapport postopératoire'}
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
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Complications</label>
                                            <textarea
                                                name="complications"
                                                value={rapportForm.complications}
                                                onChange={handleRapportInputChange}
                                                rows="2"
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
                                        />
                                    </div>
                                )}
                            </form>
                        </div>

                        <div className="modal-footer">
                            <button
                                onClick={rapport ? handleUpdateRapport : handleCreateRapport}
                                className="btn-save-rapport"
                                disabled={isSubmitting}
                            >
                                <FontAwesomeIcon icon={faCheck} /> {isSubmitting ? 'Enregistrement...' : (rapport ? 'Mettre à jour' : 'Enregistrer')}
                            </button>
                            <button
                                onClick={handleCloseRapportForm}
                                className="btn-cancel-rapport"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserCalendarView;
