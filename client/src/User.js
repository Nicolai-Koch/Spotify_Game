import { useEffect, useState } from "react";
import SpotifyPlayer from "react-spotify-web-playback";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase-config";

export default function User({ accessToken, trackUri, userId }) {
  const [points, setPoints] = useState(50);

  useEffect(() => {
    if (!userId) return;
    const userRef = doc(db, "Users", userId);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        setPoints(docSnap.data().points);
      } else {
        setDoc(userRef, { points: 50 });
        setPoints(50);
      }
    });
  }, [userId]);

  if (!accessToken) return null;

  return (
    <div>
      {/* <p>Your Points: {points}</p> */}
      <SpotifyPlayer
        token={accessToken}
        showSaveIcon
        callback={(state) => {
          if (!state.isPlaying) return;
        }}
        play={true}
        uris={trackUri ? [trackUri] : []}
      />
    </div>
  );
}
