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

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      {!user ? (
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <form className="mb-4 shadow p-4 rounded bg-light" onSubmit={isSignUp ? handleSignUp : handleLogin}>
            <h4 className="text-center mb-4">{isSignUp ? "Sign Up" : "Login"}</h4>
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

          <p className="text-center">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button className="btn btn-link p-0" onClick={() => setIsSignUp(false)} style={{ textDecoration: "none" }}>
                  Log in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button className="btn btn-link p-0" onClick={() => setIsSignUp(true)} style={{ textDecoration: "none" }}>
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      ) : (
        <div className="w-100" style={{ maxWidth: "400px" }}>
          <div className="shadow p-4 rounded bg-light text-center">
            <h3>Welcome, {user.email}</h3>
            <p>You are now logged in!</p>
            <button className="btn btn-danger w-100 mt-3" onClick={handleLogOut}>
              Log Out
            </button>
          </div>
        </div>
      )}
    </Container>
  );
}
