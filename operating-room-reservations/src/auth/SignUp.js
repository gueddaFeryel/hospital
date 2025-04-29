import React, { useState } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './SignUp.css'
function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [role, setRole] = useState('');
    const navigate = useNavigate();

    const availableRoles = [
        { value: 'MEDECIN', label: 'Médecin' },
        { value: 'INFIRMIER', label: 'Infirmier' },
        { value: 'ANESTHESISTE', label: 'Anesthésiste' }
    ];

    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'Cet email est déjà utilisé par un autre compte.';
            case 'auth/invalid-email':
                return 'Email invalide.';
            case 'auth/weak-password':
                return 'Le mot de passe doit contenir au moins 6 caractères.';
            case 'auth/missing-password':
                return 'Veuillez entrer un mot de passe.';
            default:
                return 'Une erreur est survenue. Veuillez réessayer.';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            setLoading(false);
            return;
        }

        if (!prenom || !nom || !role) {
            setError('Veuillez remplir tous les champs obligatoires.');
            setLoading(false);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                firebase_uid: user.uid,
                email: user.email,
                role: role,
                isAdmin: false,
                isApproved: false,
                createdAt: new Date(),
                nom: nom,
                prenom: prenom,
            });

            navigate('/login');
        } catch (error) {
            console.error("Erreur d'inscription:", error);
            setError(getFirebaseErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-extravagant">
            <div className="medical-particles">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`
                    }}></div>
                ))}
            </div>

            <div className="signup-card">
                <div className="medical-badge">
                    <span className="badge-icon">⚕️</span>
                </div>

                <div className="signup-header">
                    <h2>Inscription Professionnelle</h2>
                    <div className="header-underline"></div>
                    <p className="subtitle">Rejoignez notre plateforme médicale sécurisée</p>
                </div>

                {error && (
                    <div className="error-banner">
                        <div className="error-icon">!</div>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-grid">
                        <div className="input-field">
                            <input
                                type="text"
                                value={prenom}
                                onChange={(e) => setPrenom(e.target.value)}
                                required
                                placeholder=" "
                            />
                            <label>Prénom</label>
                            <div className="input-highlight"></div>
                        </div>

                        <div className="input-field">
                            <input
                                type="text"
                                value={nom}
                                onChange={(e) => setNom(e.target.value)}
                                required
                                placeholder=" "
                            />
                            <label>Nom</label>
                            <div className="input-highlight"></div>
                        </div>

                        <div className="input-field">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder=" "
                            />
                            <label>Email Professionnel</label>
                            <div className="input-highlight"></div>
                        </div>

                        <div className="input-field">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                required
                            >
                                <option value="">Sélectionnez votre rôle</option>
                                {availableRoles.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                            <label>Rôle Médical</label>
                            <div className="input-highlight"></div>
                        </div>

                        <div className="input-field">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                                placeholder=" "
                            />
                            <label>Mot de passe</label>
                            <div className="input-highlight"></div>
                        </div>

                        <div className="input-field">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                placeholder=" "
                            />
                            <label>Confirmation</label>
                            <div className="input-highlight"></div>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="submit-btn">
                        {loading ? (
                            <span className="spinner"></span>
                        ) : (
                            "S'inscrire"
                        )}
                    </button>
                </form>

                <div className="signup-footer">
                    <p>Déjà inscrit? <a href="/login" className="login-link">Connectez-vous ici</a></p>
                    <div className="security-tags">
                        <span className="security-tag">⚕️ Professionnel</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
