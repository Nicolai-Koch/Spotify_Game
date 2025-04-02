import React from "react";
import { Button } from "react-bootstrap";

export default function TrackSearchResult({
  track,
  chooseTrack,
  addToPlaylist,
}) {
  return (
    <div
      className="d-flex align-items-center m-2 p-2 border rounded"
      style={{ cursor: "pointer" }}
    >
      {/* Album Cover */}
      <img
        src={track.albumUrl}
        alt={`Album cover for ${track.title}`}
        style={{ height: "64px", width: "64px" }}
        onClick={() => chooseTrack(track)}
      />

      {/* Track Info */}
      <div className="ms-3 flex-grow-1">
        <div>{track.title}</div>
        <div className="text-muted">{track.artist}</div>
      </div>

      {/* Buttons */}
      <div className="d-flex gap-2">
        <Button variant="primary" size="sm" onClick={() => chooseTrack(track)}>
          Play
        </Button>
        <Button
          variant="success"
          size="sm"
          onClick={() => addToPlaylist(track)}
        >
          Add
        </Button>
      </div>
    </div>
  );
}
