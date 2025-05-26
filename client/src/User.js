import { useEffect, useState } from "react";
//import SpotifyPlayer from "react-spotify-web-playback";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase-config";
import { getAuth } from "firebase/auth";

export default function User({ accessToken, trackUri, userId }) {
  const [points, setPoints] = useState(50);
  const [songsPromoted, setSongsPromoted] = useState(0);
  const auth = getAuth();
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    if (!userId || !userEmail) return;

    const userRef = doc(db, "Users", userId);

    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const updates = {};

        if (data.points === undefined) updates.points = 50;
        if (data.songsPromoted === undefined) updates.songsPromoted = 0;
        if (data.email === undefined) updates.email = userEmail;
        if (Object.keys(updates).length > 0) {
          updateDoc(userRef, updates);
        }

        setPoints(data.points ?? 50);
        setSongsPromoted(data.songsPromoted ?? 0);
      } else {
        // Create user doc if it doesn't exist
        setDoc(userRef, {
          email: userEmail,
          points: 50,
          songsPromoted: 0,
          timestamp: new Date(),
        });

        setPoints(50);
        setSongsPromoted(0);
      }
    });
  }, [userId, userEmail]);

  if (!accessToken) return null;

  return (
    <div>
      {/* <p>Your Points: {points}</p> */}
      {/*
      <SpotifyPlayer
        token={accessToken}
        showSaveIcon
        callback={(state) => {
          if (!state.isPlaying) return;
        }}
        play={true}
        uris={trackUri ? [trackUri] : []}
      />
      */}
    </div>
  );
}
