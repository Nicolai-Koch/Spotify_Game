import React from "react";

export default function TrackSearchResult({ track, chooseTrack }) {
  //function handlePlay() {
  //  if (chooseTrack) chooseTrack(track);
  //}

  return (
    <div
      className="d-flex m-2 align-items-center"
      style={{ cursor: "pointer" }}
      //onClick={handlePlay}
    >
      <img
        src={track.albumUrl}
        alt="Album Art"
        style={{
          height: "48px",
          width: "48px",
          marginRight: "10px",
          borderRadius: "10px", // <-- Add this line
          objectFit: "cover",
        }}
      />
      <div className="ml-3">
        <div style={{ color: "#FFF5E1" }}>{track.title}</div>
        <div style={{ color: "#FFDAB3" }}>{track.artist}</div>
      </div>
    </div>
  );
}
