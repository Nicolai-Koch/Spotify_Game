import { useState, useEffect, useContext, createContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [expiresIn, setExpiresIn] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Hent tokens fra localStorage, hvis de er gemt
    useEffect(() => {
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');
        const storedExpiresIn = localStorage.getItem('expiresIn');

        if (storedAccessToken && storedRefreshToken && storedExpiresIn) {
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
            setExpiresIn(parseInt(storedExpiresIn, 10));
            setIsAuthenticated(true);
        }
    }, []);

    // Funktion til at opdatere access token ved hjælp af refresh token
    const refreshAccessToken = async () => {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
            }),
            headers: {
                Authorization: `Basic ${btoa('YOUR_CLIENT_ID' + ':' + 'YOUR_CLIENT_SECRET')}`,
            },
        });

        const data = await response.json();
        if (data.access_token) {
            setAccessToken(data.access_token);
            setExpiresIn(data.expires_in);
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('expiresIn', data.expires_in);
        }
    };

    // Funktion til at logge brugeren ind og hente tokens
    const login = async (authCode) => {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: authCode,
                redirect_uri: 'YOUR_REDIRECT_URI',
                client_id: 'YOUR_CLIENT_ID',
                client_secret: 'YOUR_CLIENT_SECRET',
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            setAccessToken(data.access_token);
            setRefreshToken(data.refresh_token);
            setExpiresIn(data.expires_in);
            setIsAuthenticated(true);

            // Gem tokens i localStorage
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('refreshToken', data.refresh_token);
            localStorage.setItem('expiresIn', data.expires_in);
        }
    };

    // Automatisk opdatering af access token, når det er udløbet
    useEffect(() => {
        if (accessToken && expiresIn) {
            const tokenExpirationTime = Date.now() + expiresIn * 1000;
            const timer = setInterval(() => {
                if (Date.now() > tokenExpirationTime) {
                    refreshAccessToken();
                }
            }, 60000); // Tjek hver minut for udløb

            return () => clearInterval(timer);
        }
    }, [accessToken, expiresIn]);

    return (
        <AuthContext.Provider value={{ accessToken, login, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
