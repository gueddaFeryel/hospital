import React from 'react';
import { useNavigate } from 'react-router-dom';

const InterventionCancel = () => {
    const navigate = useNavigate();

    // Ici vous ajouterez la logique d'annulation
    // Pour l'instant, juste une redirection
    React.useEffect(() => {
        navigate('/interventions');
    }, [navigate]);

    return <div>Annulation en cours...</div>;
};

export default InterventionCancel;
