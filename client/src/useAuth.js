import { useState, useEffect } from "react";
import axios from "axios";

export default function useAuth(code) {
  const [accessToken, setAccessToken] = useState();
  const [refreshToken, setRefreshToken] = useState();
  const [expiresIn, setExpiresIn] = useState();

  useEffect(() => {
    if (!code) return;

    console.log("Authorization code:", code);

    axios
      .post("https://spotifygame.dk/api/login", { code })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        setExpiresIn(res.data.expiresIn);

        // Remove the code from the URL to prevent re-triggering the login flow
        window.history.replaceState({}, null, "/");
      })
      .catch((err) => {
        console.error("Error during login:", err.message);
        alert("Failed to log in. Please try again.");
        //window.location = "/"; // Redirect to the root on failure
      });
  }, [code]);

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;

    const interval = setInterval(() => {
      axios
        .post("https://spotifygame.dk/api/refresh", { refreshToken })
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch((err) => {
          console.error("Error refreshing token:", err.message);
          alert("Session expired. Please log in again.");
          window.location = "/";
        });
    }, (expiresIn - 60) * 1000); // Refresh token 1 minute before expiration

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [refreshToken, expiresIn]);

  return accessToken;
}
