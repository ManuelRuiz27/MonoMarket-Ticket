import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const Login: React.FC = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await apiService.verifyStaffToken(token.trim());
            navigate('/events');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Token inválido o expirado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <h1>MonoMarket Scanner</h1>
                    <p>Ingresa el token de staff para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="staff-token">Token de Staff</label>
                        <textarea
                            id="staff-token"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Pega aquí el token que te compartió el organizador"
                            required
                            disabled={loading}
                            rows={4}
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
