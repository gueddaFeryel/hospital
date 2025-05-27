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

// Import des images
import medicalBackground from "../image/logo.jpg";


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
            setTimeout(() => setCanResend(true), 30000);
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
                default:
                    errorMessage = error.message || "Une erreur est survenue lors de l'envoi du lien";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-medical-theme min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${medicalBackground})` }}>
            <div className="overlay bg-black bg-opacity-30 absolute inset-0"></div>

            <div className="login-container-wrapper flex items-center justify-end min-h-screen pr-10 lg:pr-20">
                <motion.div
                    className="login-container bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="login-header text-center">

                        <h2 className="text-2xl font-bold text-gray-800">
                            <span>SGICH</span>
                        </h2>
                        <p className="welcome-text text-gray-600 mt-2">
                            {activeTab === 'login'
                                ? ' Système de gestion des interventions chirurgicales'
                                : 'Réinitialisez votre mot de passe'}
                        </p>
                    </div>



                    <div className="form-container">
                        <div className="tab-container flex justify-center gap-4 mb-6">
                            <button
                                className={`tab-button flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'login' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                onClick={() => {
                                    setActiveTab('login');
                                    setError('');
                                    setResetSent(false);
                                }}
                            >
                                <FaSignInAlt /> Connexion
                            </button>
                            <button
                                className={`tab-button flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'forgot' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                onClick={() => {
                                    setActiveTab('forgot');
                                    setError('');
                                    setResetSent(false);
                                }}
                            >
                                <FaEnvelope /> Mot de passe oublié
                            </button>
                        </div>

                        {error && (
                            <motion.div
                                className="login-error bg-red-50 text-red-700 p-3 rounded-md mb-4 border border-red-200"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="error-content flex items-center gap-2">
                                    <div className="error-icon bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm">!</div>
                                    <span>{error}</span>
                                </div>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {activeTab === 'login' ? (
                                <motion.form
                                    key="login-form"
                                    onSubmit={handleLogin}
                                    className="login-form space-y-6"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="input-group medical-input relative">
                                        <MdEmail className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder=" "
                                            aria-label="Email professionnel"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                                        />
                                        <label className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-200 pointer-events-none bg-white px-1">Email Professionnel</label>
                                    </div>

                                    <div className="input-group medical-input relative">
                                        <RiLockPasswordFill className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            placeholder=" "
                                            aria-label="Mot de passe"
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                                        />
                                        <label className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-200 pointer-events-none bg-white px-1">Mot de Passe</label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="medical-button login-button w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
                                    >
                                        {loading ? (
                                            <FaSpinner className="spinner animate-spin" />
                                        ) : (
                                            <>
                                                <FaSignInAlt />
                                                <span>Se Connecter</span>
                                            </>
                                        )}
                                    </button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="forgot-form"
                                    className="forgot-form space-y-6"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {resetSent ? (
                                        <div className="reset-success text-center space-y-4">
                                            <div className="success-icon-container">
                                                <FaCheck className="success-icon text-green-500 text-4xl mx-auto animate-bounce" />
                                            </div>
                                            <h3 className="text-xl font-semibold text-gray-800">Demande envoyée avec succès</h3>
                                            <p className="text-gray-600">
                                                Un email de réinitialisation a été envoyé à <strong className="text-blue-600">{email}</strong>.
                                            </p>
                                            <div className="check-tips text-left bg-blue-50 p-4 rounded-lg">
                                                <p className="font-medium text-blue-800">Si vous ne recevez pas l'email :</p>
                                                <ul className="list-disc pl-5 mt-2 space-y-1 text-blue-700">
                                                    <li>Vérifiez votre dossier spam/courriers indésirables</li>
                                                    <li>L'email peut prendre quelques minutes à arriver</li>
                                                    <li>Assurez-vous d'avoir entré l'adresse email correcte</li>
                                                </ul>
                                            </div>
                                            <button
                                                className="back-to-login w-full bg-gray-100 text-gray-700 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors mt-4"
                                                onClick={() => {
                                                    setActiveTab('login');
                                                    setResetSent(false);
                                                }}
                                            >
                                                <FaArrowLeft /> Retour à la connexion
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="reset-instructions text-center text-gray-600">
                                                Entrez votre email professionnel pour recevoir un lien de réinitialisation
                                            </p>
                                            <form onSubmit={handleResetPassword} className="space-y-6">
                                                <div className="input-group medical-input relative">
                                                    <FaEnvelope className="input-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        placeholder=" "
                                                        aria-label="Email professionnel pour réinitialisation"
                                                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
                                                    />
                                                    <label className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400 transition-all duration-200 pointer-events-none bg-white px-1">Email Professionnel</label>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={loading || !canResend}
                                                    className="medical-button reset-button w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md hover:shadow-lg disabled:opacity-70"
                                                >
                                                    {loading ? (
                                                        <FaSpinner className="spinner animate-spin" />
                                                    ) : (
                                                        canResend ? "Envoyer le lien" : "Veuillez patienter"
                                                    )}
                                                </button>
                                            </form>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="login-footer mt-8 pt-4 border-t border-gray-200 text-center">
                        <div className="security-badge inline-flex items-center gap-2 text-gray-500 text-sm">
                            <FaUserShield className="text-blue-500" />

                        </div>
                        <div className="signup-link mt-3 text-sm">
                            Nouveau collaborateur?{' '}
                            <a href="/signup" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                Demander un accès
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Login;
