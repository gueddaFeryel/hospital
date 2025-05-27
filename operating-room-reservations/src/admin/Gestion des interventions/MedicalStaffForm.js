import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth, db } from '../../auth/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';
import '../Gestion des interventions css/MedicalStaffForm.css';

const api = axios.create({
    baseURL: 'http://localhost:8089/api',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
});

const MedicalStaffForm = ({ editMode = false }) => {
    const { firebaseUid } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        id: null,
        email: '',
        nom: '',
        prenom: '',
        role: '',
        image: '',
        specialiteMedecin: '',
        specialiteAnesthesiste: '',
        password: '',
        confirmPassword: '',
        adminPassword: '',
        isAdmin: false,
        isApproved: true
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [emailStatus, setEmailStatus] = useState('idle');

    const roleOptions = [
        { value: 'MEDECIN', label: 'MÉDECIN' },
        { value: 'ANESTHESISTE', label: 'ANESTHÉSISTE' },
        { value: 'INFIRMIER', label: 'INFIRMIER' },
        { value: 'GESTIONNAIRE_ADMIN', label: 'GESTIONNAIRE ADMINISTRATIF' }
    ];

    const specialiteMedecinOptions = [
        { value: 'CARDIOLOGIE', label: 'Cardiologie' },
        { value: 'ORTHOPEDIE', label: 'Orthopédie' },
        { value: 'NEUROLOGIE', label: 'Neurologie' },
        { value: 'OPHTALMOLOGIE', label: 'Ophtalmologie' },
        { value: 'UROLOGIE', label: 'Urologie' },
        { value: 'GYNECOLOGIE', label: 'Gynécologie' },
        { value: 'RADIOLOGIE', label: 'Radiologie' },
        { value: 'PEDIATRIE', label: 'Pédiatrie' },
        { value: 'CHIRURGIE_GENERALE', label: 'Chirurgie Générale' },
        { value: 'TRAUMATOLOGIE', label: 'Traumatologie' },
        { value: 'DERMATOLOGIE', label: 'Dermatologie' },
        { value: 'AUTRE', label: 'Autre' }
    ];

    const specialiteAnesthesisteOptions = [
        { value: 'ANESTHESIE_CARDIOTHORACIQUE', label: 'Cardiothoracique' },
        { value: 'ANESTHESIE_SOINS_CRITIQUES', label: 'Soins Critiques' },
        { value: 'ANESTHESIE_NEUROCHIRURGICALE', label: 'Neurochirurgicale' },
        { value: 'ANESTHESIE_OBSTETRICALE', label: 'Obstétricale' },
        { value: 'ANESTHESIE_ORTHOPEDIQUE', label: 'Orthopédique' },
        { value: 'ANESTHESIE_PEDIATRIQUE', label: 'Pédiatrique' },
        { value: 'ANESTHESIE_PALLIATIVE', label: 'Palliative' },
        { value: 'ANESTHESIE_GENERALE', label: 'Générale' }
    ];

    useEffect(() => {
        emailjs.init("jEoTwyonBRh00dpd4");
    }, []);

    useEffect(() => {
        if (editMode && firebaseUid) {
            const fetchStaffData = async () => {
                try {
                    const response = await api.get(`/medical-staff/by-firebase/${firebaseUid}`);
                    setFormData({
                        id: response.data.id,
                        email: response.data.email,
                        nom: response.data.nom,
                        prenom: response.data.prenom,
                        role: response.data.role || '',
                        image: response.data.image || '',
                        specialiteMedecin: response.data.specialiteMedecin || '',
                        specialiteAnesthesiste: response.data.specialiteAnesthesiste || '',
                        password: '',
                        confirmPassword: '',
                        adminPassword: '',
                        isAdmin: response.data.role === 'GESTIONNAIRE_ADMIN',
                        isApproved: response.data.isApproved || true
                    });
                    if (response.data.image) {
                        setImagePreview(response.data.image);
                    }
                } catch (error) {
                    toast.error('Erreur lors du chargement des données');
                    console.error('Fetch error:', error);
                }
            };
            fetchStaffData();
        }
    }, [editMode, firebaseUid]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'role' && {
                isAdmin: value === 'GESTIONNAIRE_ADMIN',
                specialiteMedecin: value === 'MEDECIN' ? prev.specialiteMedecin : '',
                specialiteAnesthesiste: value === 'ANESTHESISTE' ? prev.specialiteAnesthesiste : ''
            })
        }));
        setErrors(prev => ({ ...prev, [name]: '' }));
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
            setErrors(prev => ({ ...prev, image: 'Taille maximale: 600KB' }));
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
            setErrors(prev => ({ ...prev, image: 'Formats acceptés: JPEG, PNG, GIF' }));
            return;
        }

        try {
            const compressedDataUrl = await compressImage(file);
            if (compressedDataUrl.length > 800000) {
                setErrors(prev => ({ ...prev, image: 'Image trop grande après compression' }));
                return;
            }
            setFormData(prev => ({ ...prev, image: compressedDataUrl }));
            setImagePreview(compressedDataUrl);
            setErrors(prev => ({ ...prev, image: '' }));
        } catch (error) {
            setErrors(prev => ({ ...prev, image: 'Erreur de compression' }));
            console.error('Image compression error:', error);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!editMode) {
            if (!formData.password) newErrors.password = 'Mot de passe requis';
            else if (formData.password.length < 6) newErrors.password = 'Minimum 6 caractères';
            if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirmation requise';
            else if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
            }
            if (!formData.adminPassword) newErrors.adminPassword = 'Mot de passe admin requis';
        }

        if (!formData.email) newErrors.email = 'Email requis';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
        if (!formData.nom) newErrors.nom = 'Nom requis';
        if (!formData.prenom) newErrors.prenom = 'Prénom requis';
        if (!formData.role) newErrors.role = 'Rôle requis';
        if (!formData.image && !editMode) newErrors.image = 'Image requise';

        if (formData.role === 'MEDECIN' && !formData.specialiteMedecin) {
            newErrors.specialiteMedecin = 'Spécialité médecin requise';
        }
        if (formData.role === 'ANESTHESISTE' && !formData.specialiteAnesthesiste) {
            newErrors.specialiteAnesthesiste = 'Spécialité anesthésiste requise';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const sendWelcomeEmail = async (email, password, nom, prenom) => {
        try {
            setEmailStatus('sending');

            await emailjs.send(
                'service_wmw0cua',
                'template_59cfmin',
                {
                    to_email: email,
                    to_name: `${prenom} ${nom}`,
                    password: password,
                    login_url: `${window.location.origin}/login`,
                    date: new Date().toLocaleDateString('fr-FR')
                },
                'jEoTwyonBRh00dpd4'
            );

            setEmailStatus('sent');
            toast.success('Email avec identifiants envoyé avec succès');
        } catch (error) {
            console.error("Erreur EmailJS:", error);
            setEmailStatus('failed');
            toast.warning("Membre créé mais échec de l'envoi de l'email");
        }
    };

    const validateAdminCredentials = async (email, password) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            await signOut(auth);
            return true;
        } catch (error) {
            console.error("Admin credential validation failed:", error);
            return false;
        }
    };

    const createUserWithoutSignIn = async (email, password) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error('Aucun utilisateur connecté');

            const adminEmail = currentUser.email;
            const startTime = Date.now();

            try {
                await signInWithEmailAndPassword(auth, adminEmail, formData.adminPassword);
            } catch (error) {
                throw new Error('Mot de passe admin incorrect');
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUserUid = userCredential.user.uid;

            await signInWithEmailAndPassword(auth, adminEmail, formData.adminPassword);

            const totalTime = Date.now() - startTime;
            console.log(`Opération terminée en ${totalTime}ms`);

            return newUserUid;
        } catch (error) {
            console.error("Error creating user:", error);

            if (auth.currentUser === null) {
                try {
                    await signInWithEmailAndPassword(auth, formData.email, formData.adminPassword);
                } catch (reconnectError) {
                    console.error("Reconnexion échouée:", reconnectError);
                }
            }

            throw error;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            let uid = formData.firebaseUid;

            if (!editMode) {
                uid = await createUserWithoutSignIn(formData.email, formData.password);

                const userData = {
                    firebase_uid: uid,
                    email: formData.email,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    role: formData.role,
                    createdAt: new Date().toISOString(),
                    isApproved: true,
                    ...(formData.role === 'MEDECIN' && {
                        specialiteMedecin: formData.specialiteMedecin
                    }),
                    ...(formData.role === 'ANESTHESISTE' && {
                        specialiteAnesthesiste: formData.specialiteAnesthesiste
                    }),
                    image: formData.image
                };

                await setDoc(doc(db, "users", uid), userData);

                const backendData = {
                    firebase_uid: uid,
                    email: formData.email,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    role: formData.role,
                    image: formData.image,
                    ...(formData.role === 'MEDECIN' && {
                        specialiteMedecin: formData.specialiteMedecin
                    }),
                    ...(formData.role === 'ANESTHESISTE' && {
                        specialiteAnesthesiste: formData.specialiteAnesthesiste
                    })
                };

                console.log('Sending backendData:', backendData); // Debug

                await api.post('/medical-staff/create-with-image', backendData);

                await sendWelcomeEmail(formData.email, formData.password, formData.nom, formData.prenom);
            } else {
                const backendData = {
                    email: formData.email,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    role: formData.role,
                    image: formData.image,
                    ...(formData.role === 'MEDECIN' && {
                        specialiteMedecin: formData.specialiteMedecin
                    }),
                    ...(formData.role === 'ANESTHESISTE' && {
                        specialiteAnesthesiste: formData.specialiteAnesthesiste
                    })
                };

                console.log('Updating with backendData:', backendData); // Debug

                await api.put(`/medical-staff/${formData.id}`, backendData);
            }

            toast.success(editMode ? 'Membre mis à jour avec succès' : 'Membre créé avec succès');
            navigate('/staff', { replace: true });
        } catch (error) {
            console.error('Error:', error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error('Cet email est déjà utilisé');
            } else if (error.message === 'Mot de passe admin incorrect' || error.code === 'auth/invalid-credential') {
                toast.error('Mot de passe admin incorrect. Veuillez vérifier vos identifiants.');
            } else if (error.code === 'auth/too-many-requests') {
                toast.error('Trop de tentatives. Veuillez réessayer plus tard.');
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
                toast.error(errorMessage);
            }

            if (!auth.currentUser && formData.adminPassword) {
                try {
                    await signInWithEmailAndPassword(auth, formData.email, formData.adminPassword);
                    toast.info('Session admin restaurée.');
                } catch (reconnectError) {
                    console.error('Failed to reconnect admin:', reconnectError);
                    navigate('/login', { replace: true });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <h2>{editMode ? 'Modifier' : 'Créer'} un membre médical</h2>

            <form onSubmit={handleSubmit}>
                {!editMode && (
                    <>
                        <div className="form-group">
                            <label>Mot de passe admin *</label>
                            <input
                                type="password"
                                name="adminPassword"
                                value={formData.adminPassword}
                                onChange={handleChange}
                                required
                            />
                            {errors.adminPassword && <span className="error">{errors.adminPassword}</span>}
                        </div>
                        <div className="form-group">
                            <label>Mot de passe (nouvel utilisateur) *</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={editMode}
                            />
                            {errors.password && <span className="error">{errors.password}</span>}
                        </div>
                        <div className="form-group">
                            <label>Confirmer le mot de passe *</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={editMode}
                            />
                            {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
                        </div>
                    </>
                )}

                <div className="form-group">
                    <label>Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={editMode}
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label>Nom *</label>
                    <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                    />
                    {errors.nom && <span className="error">{errors.nom}</span>}
                </div>

                <div className="form-group">
                    <label>Prénom *</label>
                    <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                    />
                    {errors.prenom && <span className="error">{errors.prenom}</span>}
                </div>

                <div className="form-group">
                    <label>Rôle *</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Sélectionnez un rôle</option>
                        {roleOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {errors.role && <span className="error">{errors.role}</span>}
                </div>

                {!editMode && (
                    <div className="form-group">
                        <label>Photo de profil *</label>
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <div className="image-preview">
                                <img src={imagePreview} alt="Preview" />
                            </div>
                        )}
                        {errors.image && <span className="error">{errors.image}</span>}
                    </div>
                )}

                {formData.role === 'MEDECIN' && (
                    <div className="form-group">
                        <label>Spécialité *</label>
                        <select
                            name="specialiteMedecin"
                            value={formData.specialiteMedecin}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez une spécialité</option>
                            {specialiteMedecinOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errors.specialiteMedecin && (
                            <span className="error">{errors.specialiteMedecin}</span>
                        )}
                    </div>
                )}

                {formData.role === 'ANESTHESISTE' && (
                    <div className="form-group">
                        <label>Spécialité *</label>
                        <select
                            name="specialiteAnesthesiste"
                            value={formData.specialiteAnesthesiste}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Sélectionnez une spécialité</option>
                            {specialiteAnesthesisteOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {errors.specialiteAnesthesiste && (
                            <span className="error">{errors.specialiteAnesthesiste}</span>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || emailStatus === 'sending'}
                    className="submit-btn"
                >
                    {loading || emailStatus === 'sending' ? (
                        <>
                            <span className="spinner"></span>
                            {emailStatus === 'sending' ? 'Envoi du mail...' : 'Enregistrement...'}
                        </>
                    ) : (
                        'Sauvegarder'
                    )}
                </button>

                {emailStatus === 'sent' && (
                    <div className="alert alert-success">
                        Email avec identifiants envoyé avec succès
                    </div>
                )}
                {emailStatus === 'failed' && (
                    <div className="alert alert-warning">
                        Membre créé mais échec de l'envoi de l'email
                    </div>
                )}
            </form>
        </div>
    );
};

export default MedicalStaffForm;
