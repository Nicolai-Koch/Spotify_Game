import "bootstrap/dist/css/bootstrap.min.css";
import Login from "./Login";
import Dashboard from "./Dashboard";
import './global.css';
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import app from "./firebase-config";

function App() {
  const [user, setUser] = useState(undefined); // undefined = loading, null = not logged in
  const [spotifyLoggedIn, setSpotifyLoggedIn] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setSpotifyLoggedIn(false); // Reset Spotify login state on user change (login/logout)
    });
    return () => unsubscribe();
  }, []);

  if (user === undefined) return null; // or a loading spinner

  if (!user) {
    return <Login onSpotifyLogin={() => setSpotifyLoggedIn(true)} />;
  }

  if (user && spotifyLoggedIn) {
    return <Dashboard />;
  }

  // Show a page with only the Spotify login button after Firebase login
  return (
    <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div
        className="mb-5 text-center"
        style={{
          position: "absolute",
          top: "20px",
        }}
      >
        <h1 className="display-4 d-none d-md-block">Spotify Game</h1>
        <h1 className="h1 d-block d-md-none">Spotify Game</h1>
      </div>
      <h2 className="mb-4" style={{ marginTop: "100px" }}>Welcome, {user.email.split("@")[0]}</h2>
      <div className="mx-auto" style={{ maxWidth: "400px" }}>
        <button
          className="btn btn-success btn-lg shadow d-flex align-items-center justify-content-center spotify-login-btn"
          style={{
            margin: "0px",
            padding: "10px",
          }}
          onClick={() => setSpotifyLoggedIn(true)}
        >
          <img
            src={require("./img/SpotifyLogo.png")}
            alt="Spotify Logo"
            style={{ height: "28px", width: "28px", marginRight: "10px" }}
          />
          <span>Login with Spotify</span>
        </button>
      </div>
    </div>
  );
}

export default App;
