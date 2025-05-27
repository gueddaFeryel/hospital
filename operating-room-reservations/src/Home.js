import { signOut } from 'firebase/auth';
import { auth } from './auth/firebase';

function Home() {
    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h1>Bienvenue</h1>
            <button onClick={handleLogout}>Déconnexion</button>
        </div>
    );
}
