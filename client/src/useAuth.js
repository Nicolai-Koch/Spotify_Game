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
      .post("https://spotifygame.dk/login", { code })
      .then((res) => {
        setAccessToken(res.data.accessToken);
        setRefreshToken(res.data.refreshToken);
        setExpiresIn(res.data.expiresIn);

        // Remove the code from the URL to prevent re-triggering the login flow
        window.history.replaceState({}, null, "/");
      })
      .catch((err) => {
        // Log the error and state before redirecting
        console.error("Error during /login request:", err.response ? err.response.data : err.message);
        console.log("State before redirecting:");
        console.log("Code:", code);
        console.log("Access Token:", accessToken);
        console.log("Refresh Token:", refreshToken);
        console.log("Expires In:", expiresIn);

        // Redirect to the root
        //window.location = "/";
      });
  }, [code]);

  useEffect(() => {
    if (!refreshToken || !expiresIn) return;

    const interval = setInterval(() => {
      axios
        .post("https://spotifygame.dk/refresh", { refreshToken })
        .then((res) => {
          setAccessToken(res.data.accessToken);
          setExpiresIn(res.data.expiresIn);
        })
        .catch(() => {
          console.error("Login error:", err);
          //window.location = "/";
        });
    }, (expiresIn - 60) * 1000); // Refresh token 1 minute before expiration

    return () => clearInterval(interval); // Clear interval on component unmount
  }, [refreshToken, expiresIn]);

  return accessToken;
}
