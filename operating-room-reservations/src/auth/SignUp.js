import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './SignUp.css';

function SignUp() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        prenom: '',
        nom: '',
        role: '',
        specialite: '',
        image: null
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSpecialite, setShowSpecialite] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const navigate = useNavigate();

    const availableRoles = [
        { value: 'MEDECIN', label: 'Médecin' },
        { value: 'INFIRMIER', label: 'Infirmier' },
        { value: 'ANESTHESISTE', label: 'Anesthésiste' }
    ];

    const specialitesMedecin = [
        'CARDIOLOGIE', 'ORTHOPEDIE', 'NEUROLOGIE', 'OPHTALMOLOGIE',
        'UROLOGIE', 'GYNECOLOGIE', 'RADIOLOGIE', 'PEDIATRIE',
        'CHIRURGIE_GENERALE', 'TRAUMATOLOGIE', 'DERMATOLOGIE', 'AUTRE'
    ];

    const specialitesAnesthesiste = [
        'ANESTHESIE_CARDIOTHORACIQUE', 'ANESTHESIE_SOINS_CRITIQUES',
        'ANESTHESIE_NEUROCHIRURGICALE', 'ANESTHESIE_OBSTETRICALE',
        'ANESTHESIE_ORTHOPEDIQUE', 'ANESTHESIE_PEDIATRIQUE',
        'ANESTHESIE_PALLIATIVE', 'ANESTHESIE_GENERALE'
    ];

    useEffect(() => {
        setShowSpecialite(formData.role === 'MEDECIN' || formData.role === 'ANESTHESISTE');
        if (!showSpecialite) {
            setFormData(prev => ({ ...prev, specialite: '' }));
        }
    }, [formData.role, showSpecialite]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const compressImage = async (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;

                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.readAsDataURL(blob);
                        },
                        'image/jpeg',
                        0.7
                    );
                };
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const MAX_SIZE = 600 * 1024;
        if (file.size > MAX_SIZE) {
            setError('Taille maximale: 600KB');
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            setError('Formats acceptés: JPEG, PNG, GIF');
            return;
        }

        try {
            const compressedDataUrl = await compressImage(file);

            if (compressedDataUrl.length > 800000) {
                setError('Image trop grande après compression');
                return;
            }

            setFormData(prev => ({ ...prev, image: compressedDataUrl }));
            setImagePreview(compressedDataUrl);
            setError('');
        } catch (error) {
            setError('Erreur de compression');
        }
    };

    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use': return 'Cet email est déjà utilisé';
            case 'auth/invalid-email': return 'Email invalide';
            case 'auth/weak-password': return 'Le mot de passe doit contenir au moins 6 caractères';
            case 'auth/missing-password': return 'Veuillez entrer un mot de passe';
            default: return 'Une erreur est survenue. Veuillez réessayer';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            setLoading(false);
            return;
        }

        if (!formData.prenom || !formData.nom || !formData.role) {
            setError('Veuillez remplir tous les champs obligatoires');
            setLoading(false);
            return;
        }

        if ((formData.role === 'MEDECIN' || formData.role === 'ANESTHESISTE') && !formData.specialite) {
            setError('Veuillez sélectionner une spécialité');
            setLoading(false);
            return;
        }

        try {
            // 1. Création du compte Firebase
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );
            const user = userCredential.user;

            // 2. Enregistrement dans Firestore avec l'image
            await setDoc(doc(db, "users", user.uid), {
                email: formData.email,
                nom: formData.nom,
                prenom: formData.prenom,
                role: formData.role,
                specialite: formData.specialite,
                image: formData.image,
                isApproved: false,
                createdAt: new Date(),
                isAdmin: false,
                firebase_uid: user.uid
            });

            navigate('/login');
        } catch (error) {
            console.error("Erreur d'inscription:", error);
            setError(error.message || getFirebaseErrorMessage(error.code));

            if (auth.currentUser) {
                try {
                    await auth.currentUser.delete();
                } catch (deleteError) {
                    console.error("Erreur lors de la suppression du compte Firebase:", deleteError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const formatSpecialiteLabel = (specialite) => {
        return specialite
            .toLowerCase()
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    return (
        <div className="signup-container">
            <div className="signup-card">
                <div className="signup-header">
                    <h2>Inscription Dans SGICH</h2>
                    <p>Rejoignez notre plateforme</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Prénom *</label>
                        <input
                            type="text"
                            name="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Nom *</label>
                        <input
                            type="text"
                            name="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Professionnel *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Rôle Médical *</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez votre rôle</option>
                            {availableRoles.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {showSpecialite && (
                        <div className="form-group">
                            <label>Spécialité *</label>
                            <select
                                name="specialite"
                                value={formData.specialite}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Sélectionnez votre spécialité</option>
                                {(formData.role === 'MEDECIN' ? specialitesMedecin : specialitesAnesthesiste).map((spec) => (
                                    <option key={spec} value={spec}>
                                        {formatSpecialiteLabel(spec)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Photo de profil</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                            </div>
                        )}
                        <small className="form-text text-muted">Optionnel - Max 600KB</small>
                    </div>

                    <div className="form-group">
                        <label>Mot de passe *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength="6"
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirmation *</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Inscription en cours...' : "S'inscrire"}
                    </button>
                </form>

                <div className="signup-footer">
                    <p>Déjà inscrit? <a href="/login">Connectez-vous ici</a></p>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
