import React, { useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUserShield, FaClinicMedical, FaSignInAlt, FaSpinner, FaEnvelope, FaArrowLeft, FaCheck } from 'react-icons/fa';
import { RiLockPasswordFill } from 'react-icons/ri';
import { MdEmail } from 'react-icons/md';
import './Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const [resetSent, setResetSent] = useState(false);
    const [canResend, setCanResend] = useState(true);
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDoc = await getDoc(doc(db, "users", user.uid));

            if (!userDoc.exists()) {
                await auth.signOut();
                throw new Error("Aucune donnée utilisateur trouvée");
            }

            const userData = userDoc.data();

            if (userData?.isApproved === false) {
                await auth.signOut();
                throw new Error("Votre compte n'a pas encore été approuvé par l'administrateur");
            }

            navigate(userData?.role === 'admin' ? '/dashboard' : '/admin');

        } catch (error) {
            console.error("Erreur de connexion:", error);
            setError(error.code === 'auth/invalid-credential'
                ? "Email ou mot de passe incorrect"
                : error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!email) {
            setError('Veuillez entrer votre email');
            setLoading(false);
            return;
        }

        if (!validateEmail(email)) {
            setError('Veuillez entrer une adresse email valide');
            setLoading(false);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setResetSent(true);
            setError('');
            setCanResend(false);
            setTimeout(() => setCanResend(true), 30000); // 30 secondes avant de pouvoir renvoyer
        } catch (error) {
            console.error("Erreur de réinitialisation:", error);
            let errorMessage = "Une erreur est survenue lors de l'envoi du lien";

            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'Aucun compte trouvé avec cet email';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Format d\'email invalide';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard';
                    break;
                case 'auth/missing-android-pkg-name':
                case 'auth/missing-continue-uri':
                case 'auth/missing-ios-bundle-id':
                case 'auth/invalid-continue-uri':
                case 'auth/unauthorized-continue-uri':
                    errorMessage = 'Erreur de configuration - contactez l\'administrateur';
                    break;
                default:
                    errorMessage = error.message || "Une erreur est survenue lors de l'envoi du lien";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-extravagant">
            <div className="particles-background">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="particle" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`
                    }}></div>
                ))}
            </div>

            <motion.div
                className="login-container"
                initial={{opacity: 0, y: 20}}
                animate={{opacity: 1, y: 0}}
                transition={{duration: 0.8}}
            >
                <div className="medical-badge">
                    <FaClinicMedical className="medical-icon"/>
                </div>

                <div className="login-header">
                    <h2>
                        <FaUserShield className="shield-icon"/>
                        <span>Connexion</span>
                    </h2>
                    <div className="header-decoration"></div>
                    <p className="welcome-text">
                        {activeTab === 'login'
                            ? 'Accédez à votre espace professionnel'
                            : 'Réinitialisez votre mot de passe'}
                    </p>
                </div>

                <div className="tab-container">
                    <button
                        className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('login');
                            setError('');
                            setResetSent(false);
                        }}
                    >
                        Connexion
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'forgot' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('forgot');
                            setError('');
                            setResetSent(false);
                        }}
                    >
                        Mot de passe oublié
                    </button>
                </div>

                {error && (
                    <motion.div
                        className="login-error"
                        initial={{opacity: 0, height: 0}}
                        animate={{opacity: 1, height: 'auto'}}
                        exit={{opacity: 0, height: 0}}
                    >
                        <div className="error-content">
                            <div className="error-icon">!</div>
                            <span>{error}</span>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {activeTab === 'login' ? (
                        <motion.form
                            key="login-form"
                            onSubmit={handleLogin}
                            className="login-form"
                            initial={{opacity: 0, x: -20}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: 20}}
                            transition={{duration: 0.3}}
                        >
                            <div className="input-group">
                                <MdEmail className="input-icon"/>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder=" "
                                    aria-label="Email professionnel"
                                />
                                <label>Email Professionnel</label>
                                <div className="input-underline"></div>
                            </div>

                            <div className="input-group">
                                <RiLockPasswordFill className="input-icon"/>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder=" "
                                    aria-label="Mot de passe"
                                />
                                <label>Mot de Passe</label>
                                <div className="input-underline"></div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="login-button"
                            >
                                {loading ? (
                                    <FaSpinner className="spinner"/>
                                ) : (
                                    <>
                                        <FaSignInAlt/>
                                        <span>Se Connecter</span>
                                    </>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.div
                            key="forgot-form"
                            className="forgot-form"
                            initial={{opacity: 0, x: 20}}
                            animate={{opacity: 1, x: 0}}
                            exit={{opacity: 0, x: -20}}
                            transition={{duration: 0.3}}
                        >
                            {resetSent ? (
                                <div className="reset-success">
                                    <FaCheck className="success-icon"/>
                                    <h3>Demande envoyée avec succès</h3>
                                    <p>
                                        Un email de réinitialisation a été envoyé à <strong>{email}</strong>.
                                    </p>
                                    <div className="check-tips">
                                        <p>Si vous ne recevez pas l'email :</p>
                                        <ul>
                                            <li>Vérifiez votre dossier spam/courriers indésirables</li>
                                            <li>L'email peut prendre quelques minutes à arriver</li>
                                            <li>Assurez-vous d'avoir entré l'adresse email correcte</li>
                                            <li>Contactez l'administrateur si vous ne recevez rien après 15 minutes</li>
                                        </ul>
                                    </div>
                                    <button
                                        className="back-to-login"
                                        onClick={() => {
                                            setActiveTab('login');
                                            setResetSent(false);
                                        }}
                                    >
                                        <FaArrowLeft/> Retour à la connexion
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <p className="reset-instructions">
                                        Entrez votre email professionnel pour recevoir un lien de réinitialisation
                                    </p>
                                    <form onSubmit={handleResetPassword}>
                                        <div className="input-group">
                                            <FaEnvelope className="input-icon"/>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="votre@email.com"
                                                aria-label="Email professionnel pour réinitialisation du mot de passe"
                                                aria-required="true"
                                            />
                                            <label>Email Professionnel</label>
                                            <div className="input-underline"></div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading || !canResend}
                                            className="reset-button"
                                            aria-disabled={loading || !canResend}
                                        >
                                            {loading ? (
                                                <FaSpinner className="spinner"/>
                                            ) : (
                                                canResend ? "Envoyer le lien de réinitialisation" : "Veuillez patienter avant de renvoyer"
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="signup-link">
                    Nouveau sur la plateforme? <a href="/signup" className="signup-link">Créer un compte</a>
                </div>

                <div className="security-item">
                    <div className="security-icon">⚕️</div>
                    <span>Environnement sécurisé</span>
                </div>
            </motion.div>
        </div>
    );
}

export default Login;