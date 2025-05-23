import { useState, useEffect, useRef } from "react";
import useAuth from "./useAuth";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Form, Button, Row, Col } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-js";
import { auth, db } from "./firebase-config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import User from "./User";
import { setDoc } from "firebase/firestore";
import JSConfetti from "js-confetti";
import { where } from "firebase/firestore";

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
  const [leaderBoard, setLeaderBoard] = useState([]);
  const [pointsBg, setPointsBg] = useState(""); // for background color
  const [showPromotionMessage, setShowPromotionMessage] = useState(false);
  const [activeList, setActiveList] = useState("playlist"); // "playlist" or "requested"

  const prevPointsRef = useRef();
  const jsConfettiRef = useRef(null);

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
        setDoc(userRef, { email: currentUser.email }, { merge: true });

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
    const q = query(
      collection(db, "Users"),
      orderBy("songsPromoted", "desc"),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLeaderBoard(users);
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
    spotifyApi
      .searchTracks(search)
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

  useEffect(() => {
    jsConfettiRef.current = new JSConfetti({
      canvas: document.getElementById("confetti"),
    });
  }, []);

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

    // const songData = songSnap.data();
    // if (songData.userId === userId) {
    //   alert("You can't vote for your own song");
    //   return;
    // }

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

        // Trigger confetti!
        if (userId === updatedSong.userId) {
          if (jsConfettiRef.current) {
            jsConfettiRef.current.addConfetti(); // normal confetti
            setShowPromotionMessage(true);
            setTimeout(() => setShowPromotionMessage(false), 3000);
          }
        }

        const requesterRef = doc(db, "Users", updatedSong.userId);
        await updateDoc(requesterRef, {
          points: increment(15),
          songsPromoted: increment(1),
          timestamp: serverTimestamp(), // <-- add this line
        });
        console.log("Confetti check:", {
          userId,
          updatedSongUserId: updatedSong.userId,
        });
        // Trigger confetti!
        if (userId === updatedSong.userId) {
          if (jsConfettiRef.current) {
            jsConfettiRef.current.addConfetti(); // No options = normal confetti
          }
        }

        await updateDoc(songRef, {
          promoted: true,
          promotedAt: serverTimestamp(),
        });

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

  useEffect(() => {
    if (userData && typeof userData.points === "number") {
      const prevPoints = prevPointsRef.current;
      if (prevPoints !== undefined && prevPoints !== userData.points) {
        if (userData.points > prevPoints) {
          setPointsBg("bg-success text-white"); // green
        } else if (userData.points < prevPoints) {
          setPointsBg("bg-danger text-white"); // red
        }
        setTimeout(() => setPointsBg(""), 2000);
      }
      prevPointsRef.current = userData.points;
    }
  }, [userData?.points]);

  useEffect(() => {
    if (!accessToken) return;
    const fetchCurrentlyPlaying = async () => {
      try {
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        if (data && data.item) {
          setPlayingTrack({
            title: data.item.name,
            artist: data.item.artists.map((a) => a.name).join(", "),
            uri: data.item.uri,
            albumUrl: data.item.album.images[0]?.url || "",
          });
        }
      } catch (err) {
        console.error("Error fetching currently playing track:", err);
      }
    };

    fetchCurrentlyPlaying();

    // Optionally, poll every 5 seconds:
    const interval = setInterval(fetchCurrentlyPlaying, 1000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const handleLogOut = async () => {
    try {
      await signOut(auth);
      // App.js will redirect to Login automatically
    } catch (error) {
      alert(error.message);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "RequestedSongs"),
      where("userId", "==", userId),
      where("promoted", "==", true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const song = change.doc.data();
          // Only trigger confetti if promotedAt is recent (e.g., last 10 seconds)
          if (
            song.promotedAt &&
            song.promotedAt.toDate &&
            Date.now() - song.promotedAt.toDate().getTime() < 10000
          ) {
            if (jsConfettiRef.current) {
              jsConfettiRef.current.addConfetti();
              setShowPromotionMessage(true);
              setTimeout(() => setShowPromotionMessage(false), 3000);
            }
          }
        }
      });
    });
    return () => unsubscribe();
  }, [userId]);

  return (
    <>
      {showPromotionMessage && (
        <div
          style={{
            position: "fixed",
            top: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#28a745",
            color: "white",
            padding: "10px 16px",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 2000,
            fontWeight: "bold",
            fontSize: "1em",
            maxWidth: "90vw",
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          🎉 Congrats! Your song promoted to Playlist
        </div>
      )}
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
              <strong>Your Points:</strong>{" "}
              <span
                id="points"
                className={pointsBg}
                style={{
                  transition: "background 0.5s",
                  borderRadius: "4px",
                  padding: "2px 8px",
                  fontWeight: "bold",
                  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
                  color: "#FFF5E1",
                  fontSize: "1.1em",
                }}
              >
                {userData.points}
              </span>
            </div>
          )}

          {/* Log Out Now button on the far right */}
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
          <>
            <div className="list-switch-btns d-flex justify-content-center mb-3">
              <Button
                variant={
                  activeList === "playlist" ? "primary" : "outline-primary"
                }
                className="me-2"
                onClick={() => setActiveList("playlist")}
              >
                Current Playlist
              </Button>
              <Button
                variant={
                  activeList === "requested" ? "primary" : "outline-primary"
                }
                className="me-2"
                onClick={() => setActiveList("requested")}
              >
                Requested Songs
              </Button>
              <Button
                variant={
                  activeList === "leaderboard" ? "primary" : "outline-primary"
                }
                onClick={() => setActiveList("leaderboard")}
              >
                Leaderboard
              </Button>
            </div>
            <Row
              className="mt-3 flex-grow-1 playlists"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
              }}
            >
              <Col xs={12}>
                <div className="d-none d-md-block">
                  <Row className="g-4">
                    <Col md={4}>
                      <div className="blurred-bg h-100 d-flex flex-column">
                        <h4>Current Playlist</h4>
                        <div className="scrollable-list flex-grow-1">
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
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="blurred-bg h-100 d-flex flex-column">
                        <h4>Requested Songs</h4>
                        <div className="scrollable-list flex-grow-1">
                          {requestedSongs.map((track) => (
                            <div
                              key={track.id}
                              className="d-flex justify-content-between align-items-center mb-2 requested-row"
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <TrackSearchResult
                                  track={track}
                                  chooseTrack={chooseTrack}
                                />
                              </div>
                              <Button
                                className="vote-btn"
                                variant="btn btn-success"
                                onClick={() => voteForSong(track.id)}
                              >
                                Vote ({track.votes})
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Col>
                    <Col md={4}>
                      <div className="blurred-bg h-100 d-flex flex-column">
                        <h4>Leaderboard</h4>
                        <div className="scrollable-list flex-grow-1">
                          {leaderBoard.map((user) => (
                            <div
                              key={user.id}
                              className="d-flex justify-content-between align-items-center mb-2"
                            >
                              <div>
                                {user.email ? (
                                  user.email.includes("@") ? (
                                    user.email.split("@")[0]
                                  ) : (
                                    user.email
                                  )
                                ) : (
                                  <span style={{ color: "gray" }}>Unknown</span>
                                )}
                              </div>
                              <div>{user.songsPromoted} songs promoted</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="d-md-none">
                  {activeList === "playlist" && (
                    <div className="blurred-bg mb-4">
                      <h4>Current Playlist</h4>
                      <div className="scrollable-list">
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
                      </div>
                    </div>
                  )}
                  {activeList === "requested" && (
                    <div className="blurred-bg mb-4">
                      <h4>Requested Songs</h4>
                      <div className="scrollable-list">
                        {requestedSongs.map((track) => (
                          <div
                            key={track.id}
                            className="d-flex justify-content-between align-items-center mb-2 requested-row"
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <TrackSearchResult
                                track={track}
                                chooseTrack={chooseTrack}
                              />
                            </div>
                            <Button
                              className="vote-btn"
                              variant="btn btn-success"
                              onClick={() => voteForSong(track.id)}
                            >
                              Vote ({track.votes})
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeList === "leaderboard" && (
                    <div className="blurred-bg">
                      <h4>Leaderboard</h4>
                      <div className="scrollable-list">
                        {leaderBoard.map((user) => (
                          <div
                            key={user.id}
                            className="d-flex justify-content-between align-items-center mb-2"
                          >
                            <div>
                              {user.email ? (
                                user.email.includes("@") ? (
                                  user.email.split("@")[0]
                                ) : (
                                  user.email
                                )
                              ) : (
                                <span style={{ color: "gray" }}>Unknown</span>
                              )}
                            </div>
                            <div>{user.songsPromoted} songs promoted</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

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
                  className="album-art"
                  style={{
                    height: "70px",
                    width: "70px",
                    maxWidth: "40vw",
                    marginRight: "10px",
                    borderRadius: "4px",
                  }}
                />
                <div className="playing-info-wrap">
                  <div className="playing-title" title={playingTrack.title}>
                    {playingTrack.title}
                  </div>
                  <div className="playing-artist" title={playingTrack.artist}>
                    {playingTrack.artist}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </Container>
      {/* Confetti canvas */}
      <canvas
        id="confetti"
        style={{
          position: "fixed",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 1000,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
