import React from 'react';

function WaitingApproval() {
    return (
        <div className="container mt-5">
            <div className="alert alert-info text-center">
                <h2>En attente d'approbation</h2>
                <p>Votre compte est en cours de vérification par un administrateur.</p>
                <p>Vous recevrez un email lorsque votre compte sera approuvé.</p>
            </div>
        </div>
    );
}

export default WaitingApproval;
