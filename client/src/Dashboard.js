import { useState, useEffect } from "react";
import useAuth from "./useAuth";
import Player from "./Player";
import TrackSearchResult from "./TrackSearchResult";
import { Container, Form, Button, ListGroup } from "react-bootstrap";
import SpotifyWebApi from "spotify-web-api-node";
import axios from "axios";

const spotifyApi = new SpotifyWebApi({
  clientId: "2b42a9bc4cdb42b4ad90f51353e95c31",
});

export default function Dashboard({ code }) {
  const accessToken = useAuth(code);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();
  const [lyrics, setLyrics] = useState("");
  const [playlist, setPlaylist] = useState([]);

  // Choose a track to play
  function chooseTrack(track) {
    setPlayingTrack(track);
    setSearch("");
    setLyrics("");
  }

  // Add a track to the playlist if it’s not already there
  function addToPlaylist(track) {
    if (!playlist.some((t) => t.uri === track.uri)) {
      setPlaylist((prevPlaylist) => [...prevPlaylist, track]);
      setSearch("");
      setLyrics("");
    }
  }

  // Remove a track from the playlist
  function removeFromPlaylist(trackUri) {
    setPlaylist((prevPlaylist) =>
      prevPlaylist.filter((track) => track.uri !== trackUri)
    );
  }

  // Fetch lyrics when a track is chosen
  useEffect(() => {
    if (!playingTrack) return;

    axios
      .get("http://localhost:3001/lyrics", {
        params: {
          track: playingTrack.title,
          artist: playingTrack.artist,
        },
      })
      .then((res) => {
        setLyrics(res.data.lyrics);
      });
  }, [playingTrack]);

  // Set Spotify API access token
  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  // Handle track search
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

  return (
    <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
      {/* Search bar */}
      <Form.Control
        type="search"
        placeholder="Search Songs/Artists"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Playlist Display */}
      <div className="my-3" style={{ overflowY: "auto", maxHeight: "300px" }}>
        <h3 className="text-center">Your Playlist</h3>
        <ListGroup>
          {playlist.map((track) => (
            <ListGroup.Item
              key={track.uri}
              className="d-flex justify-content-between align-items-center"
            >
              <div
                onClick={() => chooseTrack(track)}
                style={{ cursor: "pointer" }}
              >
                {track.title} - {track.artist}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeFromPlaylist(track.uri)}
              >
                Remove
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>

      {/* Search Results */}
      <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
        {searchResults.map((track) => (
          <TrackSearchResult
            track={track}
            key={track.uri}
            chooseTrack={chooseTrack}
            addToPlaylist={addToPlaylist}
          />
        ))}
        {searchResults.length === 0 && (
          <div className="text-center" style={{ whiteSpace: "pre" }}>
            {lyrics}
          </div>
        )}
      </div>

      {/* Player */}
      <div>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </Container>
  );
}
