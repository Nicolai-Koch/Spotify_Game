import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import app from "./firebase-config";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

const AUTH_URL =
  "https://accounts.spotify.com/authorize?client_id=2b42a9bc4cdb42b4ad90f51353e95c31&response_type=code&redirect_uri=http://localhost:3000&scope=streaming%20user-read-private%20user-read-email%20user-library-read%20user-library-modify%20user-read-playback-state%20user-modify-playback-state%20playlist-read-private%20playlist-read-collaborative%20playlist-modify-private%20playlist-modify-public";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [isSignUp, setIsSignUp] = useState(true);

  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Sign-up successful!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      alert("You have been logged out!");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSpotifyLogin = () => {
    window.location.href = AUTH_URL;
  };

  return (
    <Container
      className="d-flex flex-column justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
      }}
    >
      <h1 className="mb-5">Spotify Game</h1>
      {!user ? (
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <form
            className="mb-4 shadow p-4 rounded custom-form"
            onSubmit={isSignUp ? handleSignUp : handleLogin}
          >
            <h4 className="text-center mb-2 custom-text">
              {isSignUp ? "Sign Up" : "Login"}
            </h4>
            <input
              type="email"
              placeholder="Email"
              className="form-control mb-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="form-control mb-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary w-100 mb-4">
              {isSignUp ? "Sign Up" : "Login"}
            </button>

            <p className="text-center custom-text">
              {isSignUp ? (
                <>
                  Already have an account?{" "}
                  <button
                    className="btn btn-link p-0 custom-link"
                    onClick={() => setIsSignUp(false)}
                    style={{ textDecoration: "none" }}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    className="btn btn-link p-0 custom-link"
                    onClick={() => setIsSignUp(true)}
                    style={{ textDecoration: "none" }}
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      ) : (
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <div className="shadow p-4 rounded bg-light text-center">
            <h3>Welcome, {user.email.split("@")[0]}</h3>
            <p>You are now logged in!</p>
            <button
              className="btn btn-danger w-100 mt-3"
              onClick={handleLogOut}
            >
              Log Out
            </button>
          </div>
        </div>
      )}

      {/* Login with Spotify */}
      <div className="w-100 mt-4" style={{ maxWidth: "400px" }}>
        <button
          className="btn btn-success btn-lg w-100 shadow"
          onClick={handleSpotifyLogin}
          disabled={!user}
        >
          Login with Spotify
        </button>
      </div>
    </Container>
  );
}
// This code is a React component that provides a login and sign-up form for users. It uses Firebase Authentication to manage user accounts and allows users to log in with their Spotify account. The component handles both sign-up and login processes, displays appropriate messages, and provides a button to log out. The Spotify login button is disabled until the user is logged in with Firebase.
// The component uses React hooks to manage state and side effects, such as checking the authentication state and handling form submissions. It also includes error handling for sign-up and login attempts, displaying alerts for success or failure. The layout is styled using Bootstrap classes for a clean and responsive design.
