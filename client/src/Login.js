import React, { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import app from "./firebase-config"; // Import the initialized Firebase app
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null); // State to track the logged-in user
  const [isSignUp, setIsSignUp] = useState(true); // Toggle between Sign Up and Login

  const auth = getAuth(app); // Use the Firebase app to initialize auth

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Update the user state
    });

    return () => unsubscribe(); // Cleanup the listener on component unmount
  }, [auth]);

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed up:", userCredential.user);
      alert("Sign-up successful!");
    } catch (error) {
      console.error("Error signing up:", error.message);
      alert(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User logged in:", userCredential.user);
      alert("Login successful!");
    } catch (error) {
      console.error("Error logging in:", error.message);
      alert(error.message);
    }
  };

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      alert("You have been logged out!");
    } catch (error) {
      console.error("Error logging out:", error.message);
      alert(error.message);
    }
  };

  const handleGoToParty = () => {
    // Redirect til næste side i appen
    window.location.href = "/party"; // eller hvad ruten hedder
  };

  return (
    <Container
      className="d-flex flex-column justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      {/* Conditional Rendering */}
      {!user ? (
        <div className="w-100" style={{ maxWidth: "400px" }}>
          {/* Sign Up or Login Form */}
          <form
            className="mb-4 shadow p-4 rounded bg-light"
            onSubmit={isSignUp ? handleSignUp : handleLogin}
          >
            <h4 className="text-center mb-4">
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
            <button type="submit" className="btn btn-primary w-100 mb-3">
              {isSignUp ? "Sign Up" : "Login"}
            </button>
          </form>

          {/* Switch to Login/Sign Up Button */}
          <p className="text-center">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  className="btn btn-link p-0"
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
                  className="btn btn-link p-0"
                  onClick={() => setIsSignUp(true)}
                  style={{ textDecoration: "none" }}
                >
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="w-100" style={{ maxWidth: "400px" }}>
          {/* User Profile */}
          <div className="shadow p-4 rounded bg-light text-center">
            <h3>Welcome, {user.email}</h3>
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

      {/* Gå videre-knap */}
      <div className="w-100 mt-4" style={{ maxWidth: "400px" }}>
        <button
          className={`btn btn-success btn-lg w-100 shadow ${
            !user ? "disabled" : ""
          }`}
          onClick={handleGoToParty}
          disabled={!user}
        >
          Gå til festen 🎉
        </button>
      </div>
    </Container>
  );
}
