export const syncMedicalStaff = async (userData) => {
    const response = await fetch('http://localhost:8089/api/medical-staff/sync', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            firebase_uid: userData.id,
            email: userData.email,
            nom: userData.nom,
            prenom: userData.prenom,
            role: userData.role,
            is_admin: userData.isAdmin || false,
            createdAt: new Date().toISOString()
        }),
    });

    if (!response.ok) {
        throw new Error('Erreur de synchronisation');
    }

    return await response.json();
};
