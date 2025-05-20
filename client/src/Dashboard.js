import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-js";
import { auth, db } from "./firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import User from "./User";

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

const spotifyApi = new SpotifyWebApi();
const playlistId = "3b54L7hG3DunYZOb82dCKO";

export default function Dashboard() {
  const accessToken = useAuth(); // No code argument
  const [user, setUser] = useState(null); // State to store the logged-in user
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState(null);
  const [playlistTracks, setPlaylistTracks] = useState([]);
  const [requestedSongs, setRequestedSongs] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  function chooseTrack(track) {
    const normalizedTrack = {
      title: track.title || track.name,
      artist: track.artist || track.artists,
      uri: track.uri,
      albumUrl: track.albumUrl,
    };

    const index = playlistTracks.findIndex(
      (t) => t.uri === normalizedTrack.uri
    );
    if (index !== -1) {
      setCurrentTrackIndex(index);
    }

    setPlayingTrack(normalizedTrack);
    setSearch("");
  }

  useEffect(() => {
    if (!accessToken) return;
    console.log("Spotify access token:", accessToken);
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // Set the logged-in user
        setUserId(currentUser.uid); // Store the user's ID
        const userRef = doc(db, "Users", currentUser.uid);
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
        setUser(null); // Clear the user state if logged out
        setUserData(null);
        setLoadingUser(false);
      }
    });

    return () => unsubscribeAuth(); // Cleanup the listener on unmount
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "RequestedSongs"),
      orderBy("votes", "desc"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setRequestedSongs(songs);
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

  // fetchPlaylistTracks();
  //}, [accessToken]);

  // useEffect(() => {
  //   if (!accessToken) return;

  //   const fetchPlaylistTracks = async () => {
  //     try {
  //       spotifyApi.setAccessToken(accessToken);
  //       const data = await spotifyApi.getPlaylistTracks(playlistId);
  //       const tracks = data.body.items.map((item) => {
  //         const albumImages = item.track.album?.images || [];
  //         const albumUrl = albumImages.length > 0 ? albumImages[0].url : "";

  //         return {
  //           id: item.track.id,
  //           name: item.track.name,
  //           artists: item.track.artists.map((a) => a.name).join(", "),
  //           uri: item.track.uri,
  //           albumUrl,
  //         };
  //       });

  //       setPlaylistTracks(tracks);
  //     } catch (err) {
  //       console.error("Error fetching playlist tracks:", err);
  //     }
  //   };

  useEffect(() => {
    if (
      !playingTrack &&
      playlistTracks.length > 0 &&
      currentTrackIndex < playlistTracks.length
    ) {
      const track = playlistTracks[currentTrackIndex];
      setPlayingTrack({
        title: track.name,
        artist: track.artists,
        uri: track.uri,
        albumUrl: track.albumUrl,
      });
    }
  }, [currentTrackIndex, playlistTracks, playingTrack]);

  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      console.log("No search input, skipping search.");
      return;
    }
    if (!accessToken) {
      console.log("No access token, skipping search.");
      return;
    }
    let cancel = false;
    console.log("Searching for:", search, "with token:", accessToken);
    spotifyApi.searchTracks(search)
      .then((res) => {
        console.log("Spotify search response:", res);
        if (cancel) return;
        const items = res.tracks.items; 
        if (!items || items.length === 0) {
          console.log("No search results found for:", search);
        }
        setSearchResults(
          items.map((track) => {
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
      })
      .catch((err) => {
        console.error("Spotify search error:", err);
        setSearchResults([]);
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

    const songSnap = await getDoc(songRef);
    if (!songSnap.exists()) {
      alert("Song not found");
      return;
    }

    const songData = songSnap.data();
    if (songData.userId === userId) {
      alert("You can't vote for your own song");
      return;
    }

    await updateDoc(userRef, { points: increment(-5) });
    await updateDoc(songRef, {
      [`votedUsers.${userId}`]: true,
      votes: increment(1),
    });

    const updatedSongSnap = await getDoc(songRef);
    const updatedSong = updatedSongSnap.data();

    if (updatedSong.votes >= 4) {
      try {
        await spotifyApi.addTracksToPlaylist(playlistId, [updatedSong.uri]);
        console.log("Song added to Spotify:", updatedSong.title);

        //const updatedSong = await getDoc(songRef);

        await addDoc(collection(db, "Playlist"), {
          title: updatedSong.title || updatedSong.name, // fallback to name if title is missing
          artist: updatedSong.artist || updatedSong.artists, // fallback to artists if artist is missing
          uri: updatedSong.uri,
          albumUrl: updatedSong.albumUrl,
          timestamp: serverTimestamp(),
        });
        const requesterRef = doc(db, "Users", updatedSong.userId);
        await updateDoc(requesterRef, { points: increment(15) });

        await deleteDoc(songRef);
      } catch (err) {
        console.error("Failed to add song to playlist:", err);
        alert("Failed to add song to playlist.");
      }
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

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      // Optionally, show a message or redirect
    } catch (error) {
      alert(error.message);
    }
  };

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
        <div className="d-flex justify-content-between align-items-center mb-3">
          {/* User's email on the left */}
          {user && (
            <div>
              <strong>{user.email.split("@")[0]}</strong>
            </div>
          )}

          {/* User's points on the right */}
          {!loadingUser && userData && (
            <div>
              <strong>Your Points:</strong> {userData.points}
            </div>
          )}

          {/* Log Out button on the far right */}
          <button className="btn btn-danger ms-3" onClick={handleLogOut}>
            Log Out
          </button>
        </div>

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
          <Row
            className="mt-3 flex-grow-1 playlists"
            style={{ overflowY: "auto" }}
          >
            <Col>
              <h4>Current Playlist</h4>
              {playlistTracks.map((track) => (
                <div
                  key={track.id}
                  className="d-flex justify-content-between align-items-center mb-2"
                >
                  <TrackSearchResult
                    track={{
                      title: track.title,
                      artist: track.artist,
                      uri: track.uri,
                      albumUrl: track.albumUrl,
                    }}
                    chooseTrack={chooseTrack}
                  />
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

        {playingTrack && (
          <div
            className="mt-2 d-flex align-items-center"
            style={{
              padding: "10px",
              borderRadius: "8px",
            }}
          >
            <img
              src={playingTrack.albumUrl}
              alt="Album Art"
              style={{
                height: "64px",
                width: "64px",
                marginRight: "15px",
                borderRadius: "4px",
              }}
            />
            <div>
              <div style={{ fontWeight: "bold", fontSize: "1.1em" }}>
                {playingTrack.title}
              </div>
              <div style={{ color: "gray" }}>{playingTrack.artist}</div>
            </div>
          </div>
        )}
      </Container>
    </>
  );
}
