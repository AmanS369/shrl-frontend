import React, { useState, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import axios from "axios";
import QRCode from "qrcode.react";
import "./ShortenURL.css";
import { useDropzone } from "react-dropzone";
import { Link, MessageSquare } from "lucide-react";

const ShortenURL = () => {
  const [toggle, setToggle] = useState("link");
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");
  const [shrl_link, setShrl_link] = useState("");
  const [qrCodeValue, setQRCodeValue] = useState("");
  const [text, setText] = useState("");
  const API_URL = process.env.REACT_APP_API_URL;

  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
  };
  initializeApp(firebaseConfig);
  const storage = getStorage();

  const handleLabelClick = (value) => {
    setToggle(value);
    setFile(null);
    setLink("");
    setText("");
    setShrl_link("");
    setQRCodeValue("");
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setToggle("file");
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "*/*",
    noClick: true,
  });

  const handleShorten = async () => {
    setIsLoading(true);
    let url = "";
    if (toggle === "link") {
      url = API_URL + "newShort";
      try {
        const response = await axios.post(
          url,
          { bodyURL: link },
          {
            headers: {
              "Content-Type": "application/json",
              "x-api-key": process.env.REACT_APP_API_KEY,
            },
          },
        );
        setShrl_link(response.data.message);
        setQRCodeValue(response.data.message);
      } catch (error) {
        console.error("Error shortening URL:", error);
      }
    } else if (toggle === "file" && file) {
      url = API_URL + "valid_key";
      try {
        const res = await axios.get(url, {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        const validity = res.data;
        if (validity.valid) {
          const storageRef = ref(storage, `web/${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          url = API_URL + "ups3";
          const response = await axios.post(
            url,
            { s3url: downloadURL },
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.REACT_APP_API_KEY,
              },
            },
          );
          setShrl_link(response.data.message);
          setQRCodeValue(response.data.message);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    } else if (toggle === "text") {
      try {
        const res = await axios.get(API_URL + "valid_key", {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.REACT_APP_API_KEY,
          },
        });
        const validity = res.data;
        if (validity.valid) {
          const blob = new Blob([text], { type: "text/plain" });
          const storageRef = ref(storage, `web/${Date.now()}_text.txt`);
          await uploadBytes(storageRef, blob);
          const downloadURL = await getDownloadURL(storageRef);
          const response = await axios.post(
            API_URL + "ups3",
            { s3url: downloadURL },
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": process.env.REACT_APP_API_KEY,
              },
            },
          );
          setShrl_link(response.data.message);
          setQRCodeValue(response.data.message);
        }
      } catch (error) {
        console.error("Error uploading text:", error);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="container" {...getRootProps()}>
      <input {...getInputProps()} />
      <header className="header">
        <div className="logo-title">
          <img src="/img.png" alt="Logo" className="logo" />
        </div>
        <a href="/room" className="room-link" aria-label="Go to chat rooms">
          <MessageSquare size={24} />
          <span>Go to Rooms</span>
        </a>
      </header>

      <main className="main-content">
        <div className="tabs">
          <button
            className={`tab ${toggle === "link" ? "active" : ""}`}
            onClick={() => handleLabelClick("link")}
          >
            Link
          </button>
          <button
            className={`tab ${toggle === "file" ? "active" : ""}`}
            onClick={() => handleLabelClick("file")}
          >
            File
          </button>
          <button
            className={`tab ${toggle === "text" ? "active" : ""}`}
            onClick={() => handleLabelClick("text")}
          >
            Text
          </button>
        </div>

        <div className={`input-container ${isDragActive ? "drag-active" : ""}`}>
          {toggle === "link" && (
            <textarea
              className="url-input"
              placeholder="Enter URL here..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              aria-label="Enter URL to shorten"
            />
          )}
          {toggle === "file" && (
            <div
              className="file-drop-zone"
              onClick={() => document.getElementById("fileInput").click()}
            >
              <input
                id="fileInput"
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              {file ? (
                <p>File selected: {file.name}</p>
              ) : (
                <p>Drag & drop a file here, or click to select a file</p>
              )}
            </div>
          )}
          {toggle === "text" && (
            <textarea
              className="url-input"
              placeholder="Enter text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Enter text to shorten"
            />
          )}
          <button
            className={`shorten-btn ${isLoading ? "disabled" : ""}`}
            onClick={handleShorten}
            disabled={
              isLoading ||
              (toggle === "link" && !link.trim()) ||
              (toggle === "file" && !file) ||
              (toggle === "text" && !text.trim())
            }
          >
            {isLoading ? "Shortening..." : "Shorten"}
          </button>
        </div>

        {shrl_link && (
          <div className="link-container">
            <h2 className="shortened-label">Shortened Link:</h2>
            <a
              href={shrl_link}
              target="_blank"
              rel="noopener noreferrer"
              className="shortened-link"
            >
              {shrl_link}
            </a>
            <div className="qr-code">
              <QRCode value={qrCodeValue} size={128} />
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <p className="beta-text">Release 1.2</p>
        <Link size={24} />
      </footer>
    </div>
  );
};

export default ShortenURL;
