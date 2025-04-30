import { useState, useEffect } from "react";
import SpotifyPlayer from "react-spotify-web-playback";

export default function Player({
  accessToken,
  playlistTracks,
  currentTrackIndex,
  setCurrentTrackIndex,
}) {
  const [play, setPlay] = useState(false);

  // Get a list of URIs from the playlist
  const uris = playlistTracks.map((track) => track.uri);

  useEffect(() => {
    if (
      accessToken &&
      currentTrackIndex !== null &&
      playlistTracks.length > 0
    ) {
      setPlay(false); // Start playback once the access token and track info are available
    }
  }, [accessToken, currentTrackIndex]);

  if (
    !accessToken ||
    playlistTracks.length === 0 ||
    currentTrackIndex === null ||
    !playlistTracks[currentTrackIndex]?.uri
  ) {
    return null; // Don't render if the required data is missing
  }

  return (
    <SpotifyPlayer
      token={accessToken}
      showSaveIcon
      callback={(state) => {
        if (
          !state.isPlaying &&
          state.progressMs === 0 &&
          !state.nextTracks.length
        ) {
          // Auto-play next track
          setCurrentTrackIndex((prev) =>
            prev + 1 < playlistTracks.length ? prev + 1 : 0
          );
        }
      }}
      play={play} // Only trigger play once it's safe to do so
      uris={uris.slice(currentTrackIndex)} // Start queue from current track
      styles={{
        activeColor: "#1db954",
        trackNameColor: "#fff",
        color: "#fff",
        bgColor: "#181818",
        sliderColor: "#1db954",
      }}
    />
  );
}
