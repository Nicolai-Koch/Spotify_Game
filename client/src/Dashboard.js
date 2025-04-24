import { useState, useEffect } from "react";
import useAuth from "./useAuth"; // Custom hook to handle Spotify authentication
import Player from "./Player"; // Spotify Player component
import TrackSearchResult from "./TrackSearchResult"; // Component to display individual track
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node"; // Spotify Web API wrapper
import axios from "axios"; // For lyrics API call
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

// ... all your existing imports remain the same

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [requestedSongs, setRequestedSongs] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [lyrics, setLyrics] = useState(""); // Define the state for lyrics

  function chooseTrack(track) {
    const index = playlistTracks.findIndex((t) => t.uri === track.uri);
    if (index !== -1) {
      setCurrentTrackIndex(index);
    }
    setPlayingTrack(track);
    setSearch("");
  }

  useEffect(() => {
    if (!playingTrack) return;

    axios
      .get("https://spotifygame.dk/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then((res) => {
        setLyrics(res.data.lyrics || "No lyrics found");
      })
      .catch((err) => {
        console.error("Error fetching lyrics:", err);
        setLyrics("Error fetching lyrics");
      });
  }, [playingTrack]);

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

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

  useEffect(() => {
    if (
      playlistTracks.length > 0 &&
      currentTrackIndex < playlistTracks.length
    ) {
      setPlayingTrack(playlistTracks[currentTrackIndex]);
    }
  }, [currentTrackIndex, playlistTracks]);

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

  async function voteForSong(songId) {
    if (!userData || userData.points < 5) {
      alert("Not enough points to vote");
      return;
    }

    const songRef = doc(db, "RequestedSongs", songId);
    const userRef = doc(db, "Users", userId);

    await updateDoc(userRef, { points: increment(-5) });
    await updateDoc(songRef, { votes: increment(1) });

    const updatedSong = await getDoc(songRef);
    if (updatedSong.data().votes >= 4) {
      await addDoc(collection(db, "Playlist"), updatedSong.data());
      await deleteDoc(songRef);
    }
  }

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
              <h4>Current Playlist</h4>
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
