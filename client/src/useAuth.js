import { useState, useEffect } from "react";
import axios from "axios";

export default function useAuth() {
  const [accessToken, setAccessToken] = useState();
  const [expiresIn, setExpiresIn] = useState();

  useEffect(() => {
    // Always fetch admin access token
    axios
      .get("http://localhost:3001/api/admin-access-token")
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setExpiresIn(res.data.expiresIn);
      })
      .catch((err) => {
        console.error("Error fetching admin access token:", err.message);
      });
  }, []);

  useEffect(() => {
    if (!expiresIn) return;

    const interval = setInterval(() => {
      axios
        .get("http://localhost:3001/api/admin-access-token")
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch((err) => {
          console.error("Error refreshing admin access token:", err.message);
          window.location = "/"; // Redirect to login page if token refresh fails
        });
    }, (expiresIn - 60) * 1000);

    return () => clearInterval(interval);
  }, [expiresIn]);

  return accessToken;
}
