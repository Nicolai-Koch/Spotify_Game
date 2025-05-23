require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const lyricsFinder = require("lyrics-finder");
const SpotifyWebApi = require("spotify-web-api-node");
const http = require("http");
//const WebSocket = require("ws");
const app = express();
const server = http.createServer(app);
//const wss = new WebSocket.Server({ server, path: "/ws" });
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/refresh", (req, res) => {
  console.log("Received refresh token:", req.body.refreshToken); // Log the received refresh token
  const refreshToken = req.body.refreshToken;

  if (!refreshToken) {
    console.error("No refresh token provided");
    return res.status(400).send("Refresh token is required");
  }

  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      console.log("New access token:", data.body.access_token); // <-- use underscore
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,    
      });
    })
    .catch((err) => {
      console.error("Error refreshing access token:", err); // Log the error
      res.sendStatus(400);
    });
});

app.post("/api/login", (req, res) => {
  const code = req.body.code;
  console.log("Received code:", code); // Log the received code

  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      console.log("Spotify API response:", data.body); // Log the response from Spotify
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err) => {
      console.error("Error in /login endpoint:", err); // Log the error
      res.status(400).json({ error: "Failed to authenticate with Spotify" });
    });
});

app.get("/api/admin-access-token", async (req, res) => {
  const spotifyApi = new SpotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.ADMIN_REFRESH_TOKEN,
  });

  try {
    const data = await spotifyApi.refreshAccessToken();
    console.log("Spotify refreshAccessToken response:", data.body);
    res.json({
      accessToken: data.body.access_token,
      expiresIn: data.body.expires_in,   
    });
  } catch (err) {
    console.error("Error refreshing admin access token:", err);
    res.status(400).json({});
  }
});

//wss.on("connection", (ws) => {
  //console.log("WebSocket client connected");

  //ws.on("message", (message) => {
    //console.log("Received:", message);
    //ws.send("You said: " + message);
  //});

  //ws.on("close", () => {
    //console.log("WebSocket client disconnected");
  //});
//});

server.listen(3001, '0.0.0.0', () => {
  console.log('Server is running on port 3001');
});
