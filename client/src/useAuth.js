import { useState, useEffect } from "react";
import axios from "axios";

export default function useAuth() {
  const [accessToken, setAccessToken] = useState();
  const [expiresIn, setExpiresIn] = useState();

  useEffect(() => {
    // Always fetch admin access token
    axios
      .get("https://spotifygame.dk/admin-access-token")
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
        .get("https://spotifygame.dk/admin-access-token")
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch((err) => {
          console.error("Error refreshing admin access token:", err.message);
        });
    }, (expiresIn - 60) * 1000);

    return () => clearInterval(interval);
  }, [expiresIn]);

  return accessToken;
}
