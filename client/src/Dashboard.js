import { useState, useEffect } from "react";
import useAuth from "./useAuth"; // Custom hook to handle Spotify authentication
import Player from "./Player"; // Spotify Player component
import TrackSearchResult from "./TrackSearchResult"; // Component to display individual track
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node"; // Spotify Web API wrapper
import { auth, db } from "./firebase-config"; // Firebase configuration
import { onAuthStateChanged } from "firebase/auth"; // Firebase auth listener
import User from "./User"; // Component for user logic

// Firebase Firestore imports
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  increment,
  addDoc,
  serverTimestamp,
  getDoc,
  deleteDoc,
} from "firebase/firestore";

// Create a Spotify API instance
const spotifyApi = new SpotifyWebApi({
  clientId: "2b42a9bc4cdb42b4ad90f51353e95c31",
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code); // Now using accessToken from useAuth hook
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [requestedSongs, setRequestedSongs] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Function to choose a track from the playlist
  function chooseTrack(track) {
    const index = playlistTracks.findIndex((t) => t.uri === track.uri);
    if (index !== -1) {
      setCurrentTrackIndex(index);
    }
    setPlayingTrack(track);
    setSearch("");
  }

  // Set the Spotify API access token once it's available
  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = doc(db, "Users", user.uid);
        const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
            setLoadingUser(false);
          } else {
            setUserData(null);
            setLoadingUser(false);
          }
        });
        return () => unsubscribeSnapshot();
      } else {
        setUserData(null);
        setLoadingUser(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Fetch requested songs from Firestore
  useEffect(() => {
    const q = query(
      collection(db, "RequestedSongs"),
      orderBy("votes", "desc"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequestedSongs(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    });
    return () => unsubscribe();
  }, []);

  // Fetch playlist tracks from Firestore
  useEffect(() => {
    const q = query(collection(db, "Playlist"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tracks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlaylistTracks(tracks);
    });
    return () => unsubscribe();
  }, []);

  // Update the currently playing track when the track index changes
  useEffect(() => {
    if (
      playlistTracks.length > 0 &&
      currentTrackIndex < playlistTracks.length
    ) {
      setPlayingTrack(playlistTracks[currentTrackIndex]);
    }
  }, [currentTrackIndex, playlistTracks]);

  // Handle searching for tracks
  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;
    let cancel = false;
    spotifyApi.searchTracks(search).then((res) => {
      if (cancel) return;
      setSearchResults(
        res.body.tracks.items.map((track) => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest, image) =>
              image.height < smallest.height ? image : smallest,
            track.album.images[0]
          );
          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
          };
        })
      );
    });
    return () => (cancel = true);
  }, [search, accessToken]);

  // Request song to the Firestore database
  async function requestSong(track) {
    if (!userData || userData.points < 10) {
      alert("Not enough points to request song");
      return;
    }

    const userRef = doc(db, "Users", userId);
    await updateDoc(userRef, { points: increment(-10) });

    await addDoc(collection(db, "RequestedSongs"), {
      ...track,
      timestamp: serverTimestamp(),
      votes: 0,
      userId,
      archived: false,
    });
    setSearch("");
  }

  // Voting functionality
  async function voteForSong(songId) {
    if (!userData || userData.points < 5) {
      alert("Not enough points to vote");
      return;
    }

    const songRef = doc(db, "RequestedSongs", songId);
    const userRef = doc(db, "Users", userId);
    const votedUsers = (await getDoc(songRef)).data().votedUsers;

    await updateDoc(userRef, { points: increment(-5) });
    await updateDoc(songRef, { votes: increment(1) });
    await updateDoc(songRef, { VotedUsers: userId });

    const updatedSong = await getDoc(songRef);
    if (updatedSong.data().votes >= 4) {
      await addDoc(collection(db, "Playlist"), updatedSong.data());
      const requesterId = updatedSong.data().userId;
      const requesterRef = doc(db, "Users", requesterId);
      await updateDoc(requesterRef, { points: increment(15) });
      await deleteDoc(songRef);
    }
  }

  return (
    <>
      <User
        accessToken={accessToken}
        trackUri={playingTrack?.uri}
        userId={userId}
      />
      <Container
        className="d-flex flex-column py-2"
        style={{ height: "100vh" }}
      >
        {!loadingUser && userData && (
          <div style={{ textAlign: "right", marginBottom: "10px" }}>
            <strong>Your Points:</strong> {userData.points}
          </div>
        )}

        <Form.Control
          type="search"
          placeholder="Search Songs/Artists"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <div className="my-2" style={{ overflowY: "auto" }}>
            {searchResults.map((track) => (
              <div
                key={track.uri}
                className="d-flex justify-content-between align-items-center"
              >
                <TrackSearchResult track={track} chooseTrack={chooseTrack} />
                <Button
                  variant="outline-success"
                  onClick={() => requestSong(track)}
                >
                  Request
                </Button>
              </div>
            ))}
          </div>
        )}

        {!search && (
          <Row className="mt-3 flex-grow-1" style={{ overflowY: "auto" }}>
            <Col>
              <h4>Current Playlist!!</h4>
              {playlistTracks.map((track) => (
                <div
                  key={track.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <TrackSearchResult track={track} chooseTrack={chooseTrack} />
                </div>
              ))}
            </Col>

            <Col>
              <h4>Requested Songs</h4>
              {requestedSongs.map((track) => (
                <div
                  key={track.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <TrackSearchResult track={track} chooseTrack={chooseTrack} />
                  <Button
                    variant="outline-primary"
                    onClick={() => voteForSong(track.id)}
                  >
                    Vote ({track.votes})
                  </Button>
                </div>
              ))}
            </Col>
          </Row>
        )}

        <Player
          accessToken={accessToken}
          playlistTracks={playlistTracks}
          currentTrackIndex={currentTrackIndex}
          setCurrentTrackIndex={setCurrentTrackIndex}
        />
      </Container>
    </>
  );
}
// This code is a React component that serves as a dashboard for a Spotify game application. It allows users to search for songs, request them, and vote on requested songs. The component uses Firebase for user authentication and Firestore for storing song requests and playlists. The Spotify Web API is used to search for tracks and manage playback.
// The component also handles user points, allowing users to earn points for requesting songs and voting on them. The UI is built using React Bootstrap for styling and layout.