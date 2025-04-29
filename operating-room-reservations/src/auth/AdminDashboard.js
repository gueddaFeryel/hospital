import React, { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faUserClock,
    faCalendarCheck,
    faChartBar,
    faCog,
    faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { signOut } from 'firebase/auth';
import './AdminDashboard.css';

function AdminDashboard() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPendingUsers = async () => {
            const q = query(
                collection(db, 'users'),
                where('isApproved', '==', false)
            );
            const querySnapshot = await getDocs(q);
            setPendingUsers(querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })));
            setLoading(false);
        };
        fetchPendingUsers();
    }, []);

    const approveUser = async (userId) => {
        setIsSyncing(true);
        try {
            const userToApprove = pendingUsers.find(user => user.id === userId);

            if (!userToApprove) throw new Error('Utilisateur non trouvé');
            if (!userToApprove.role) throw new Error('Le rôle est obligatoire');

            const response = await fetch('http://localhost:8089/api/medical-staff/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebase_uid: userToApprove.id,
                    email: userToApprove.email || '',
                    nom: userToApprove.nom || '',
                    prenom: userToApprove.prenom || '',
                    role: userToApprove.role.toUpperCase(),
                    is_admin: false,
                    is_approved: true
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur de synchronisation');
            }

            await updateDoc(doc(db, 'users', userId), { isApproved: true });
            setPendingUsers(pendingUsers.filter(user => user.id !== userId));
            alert('Utilisateur approuvé avec succès!');
        } catch (error) {
            console.error("Erreur d'approbation:", error);
            alert(`Erreur: ${error.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Erreur lors de la déconnexion:", error);
            alert("Une erreur est survenue lors de la déconnexion");
        }
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="admin-sidebar">
                    <div className="sidebar-header">
                        <h3>Tableau de Bord</h3>
                    </div>
                </div>
                <div className="admin-content loading">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-sidebar">
                <div className="sidebar-header">
                    <h3>Tableau de Bord</h3>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li className={location.pathname === '/dashboard' ? 'active' : ''}>
                            <Link to="/dashboard">
                                <FontAwesomeIcon icon={faUserClock}/>
                                <span>Utilisateurs</span>
                            </Link>
                        </li>
                        <li className={location.pathname === '/interventionList' ? 'active' : ''}>
                            <Link to="/interventionList">
                                <FontAwesomeIcon icon={faCalendarCheck}/>
                                <span>Interventions</span>
                            </Link>
                        </li>
                        <li className={location.pathname === '/reservation' ? 'active' : ''}>
                            <Link to="/reservation">
                                <FontAwesomeIcon icon={faChartBar}/>
                                <span>Reservations</span>
                            </Link>
                        </li>
                        <li className={location.pathname === '/staff' ? 'active' : ''}>
                            <Link to="/staff">
                                <FontAwesomeIcon icon={faCog}/>
                                <span>l'equipe medicale</span>
                            </Link>
                        </li>
                        <li className={location.pathname === '/salle' ? 'active' : ''}>
                            <Link to="/salle">
                                <FontAwesomeIcon icon={faCog}/>
                                <span>Salle</span>
                            </Link>
                        </li>
                        <li className={location.pathname === '/materiels' ? 'active' : ''}>
                            <Link to="/materiels">
                                <FontAwesomeIcon icon={faCog}/>
                                <span>Materiels</span>
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faSignOutAlt}/>
                        <span>Déconnexion</span>
                    </button>
                </div>
            </div>

            <div className="admin-content">
                <div className="content-header">
                    <h2>Utilisateurs en attente d'approbation</h2>
                </div>

                {pendingUsers.length === 0 ? (
                    <div className="empty-state">
                        <p>Aucun utilisateur en attente d'approbation</p>
                    </div>
                ) : (
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                            <tr>
                                <th>Nom Complet</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {pendingUsers.map(user => (
                                <tr key={user.id}>
                                    <td>{user.prenom} {user.nom}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => approveUser(user.id)}
                                            disabled={isSyncing}
                                            className="approve-btn"
                                        >
                                            {isSyncing ? 'Traitement...' : 'Approuver'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;