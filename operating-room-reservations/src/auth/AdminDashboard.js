import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { FaSearch, FaUserCheck } from 'react-icons/fa';
import './AdminDashboard.css';

function AdminDashboard() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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

    const filteredUsers = pendingUsers.filter(user =>
        `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="admin-dashboard-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-container">
            {/* En-tête avec effet verre */}
            <div className="dashboard-header">
                <div className="header-content">
                    <h2>Approbation des Utilisateurs</h2>

                    {/* Barre de recherche déplacée sous le titre */}
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            className="search-bar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="dashboard-content">
                {filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        {pendingUsers.length === 0 ? (
                            <p>Aucun utilisateur en attente d'approbation</p>
                        ) : (
                            <p>Aucun résultat trouvé pour "{searchTerm}"</p>
                        )}
                    </div>
                ) : (
                    <div className="users-table-wrapper">
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
                            {filteredUsers.map((user, index) => (
                                <tr key={user.id} style={{ animationDelay: `${index * 0.1}s` }}>
                                    <td>{user.prenom} {user.nom}</td>
                                    <td>{user.email}</td>
                                    <td>
                                            <span className={`role-badge ${user.role.toLowerCase()}`}>
                                                {user.role}
                                            </span>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => approveUser(user.id)}
                                            disabled={isSyncing}
                                            className="approve-btn"
                                        >
                                            <FaUserCheck /> {isSyncing ? 'Traitement...' : 'Approuver'}
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
