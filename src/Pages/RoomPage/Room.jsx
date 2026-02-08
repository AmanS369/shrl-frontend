import "../../App.css";
import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import FileDropHandler from "../../Component/Rooms/FileDropHandler";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SharedFiles from "../../Component/Rooms/SharedFile";

import { Copy, PaperclipIcon } from "lucide-react";
import FileUploadProgress from "../../Component/Rooms/FileUploadProgress";
import Message from "../../Component/Rooms/Message";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import "../../App.css";
import "./Chat.css"; // Import chat-specific CSS
const nameConfig = {
  dictionaries: [colors, adjectives, animals],
  separator: "",
  length: 3,
  style: "capital",
};
const generateRandomName = () => {
  return uniqueNamesGenerator(nameConfig); // e.g., RedQuickFox
};
const Room = () => {
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [userName, setUserName] = useState(() => {
    const savedName = localStorage.getItem("chatUserName");
    if (savedName) return savedName;
    const newName = generateRandomName();
    localStorage.setItem("chatUserName", newName);
    return newName;
  });
  // eslint-disable-next-line no-unused-vars
  const [isNameSet, setIsNameSet] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showCopied, setShowCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_ROOM_URL;
  const firebaseApp = initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  });
  const storage = getStorage(firebaseApp);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlRoomId = params.get("roomId");
    if (urlRoomId) {
      setInputRoomId(urlRoomId);
    }
  }, [location]);

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("joinRoom", { roomId, userName });

    socket.on("loadMessages", (loadedMessages) => setMessages(loadedMessages));
    socket.on("loadFiles", (loadedFiles) => setFiles(loadedFiles));
    socket.on("receiveMessage", (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });
    socket.on("fileShared", (newFile) => {
      setFiles((prev) => [...prev, newFile]); // Add this handler
    });
    socket.on("fileDeleted", ({ fileUrl }) => {
      setFiles((prev) => prev.filter((file) => file.fileUrl !== fileUrl));
    });

    return () => {
      socket.off("loadMessages");
      socket.off("loadFiles");
      socket.off("receiveMessage");
      socket.off("fileShared"); // Clean up new event listener
      socket.off("fileDeleted");
    };
  }, [socket, roomId, userName]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "inherit";
      const computed = window.getComputedStyle(textarea);
      const height =
        textarea.scrollHeight +
        parseInt(computed.getPropertyValue("border-top-width")) +
        parseInt(computed.getPropertyValue("border-bottom-width"));

      textarea.style.height = `${Math.min(height, 200)}px`; // Max height of 200px
    }
  };

  // Call adjust height whenever message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  useEffect(() => {
    const socketInstance = io(API_URL, { transports: ["websocket"] });
    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, [API_URL]);


  const cancelUpload = (fileId) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
    // If you want to cancel the actual upload, you'd need to store the uploadTask reference
    // and call uploadTask.cancel() here
  };
  const handleFileUpload = async (file) => {
    try {
      setIsUploading(true);
      const fileId = `${roomId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileId);

      setUploadingFiles((prev) => [
        ...prev,
        {
          id: fileId,
          fileName: file.name,
          progress: 0,
        },
      ]);

      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      socket.emit("sendMessage", {
        roomId,
        sender: userName,
        text: `Shared a file: ${file.name}`,
        fileInfo: {
          fileName: file.name,
          fileUrl,
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (file) => {
    socket.emit("deleteFile", { roomId, fileUrl: file.fileUrl });
  };

  const handleCreateRoom = async () => {
    try {
      const response = await axios.post(`${API_URL}create`);
      const newRoomId = response.data.room.roomId;
      setRoomId(newRoomId);
      navigate(`?roomId=${newRoomId}`, { replace: true });
    } catch (error) {
      alert("Failed to create room. Please try again.");
    }
  };

  const handleJoinRoom = async () => {
    // Validate room ID is exactly 6 digits
    if (inputRoomId.length !== 6 || !/^\d{6}$/.test(inputRoomId)) {
      alert("Room ID must be exactly 6 digits");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}join/${inputRoomId}`);
      setRoomId(response.data.room.roomId);
      navigate(`?roomId=${inputRoomId}`, { replace: true });
    } catch (error) {
      alert("Failed to join room. Please check the room ID and try again.");
    }
  };
  const handleShareRoom = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?roomId=${roomId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      alert("Failed to copy URL. Please copy it manually.");
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", {
      roomId,
      sender: userName,
      text: message,
      isMarkdown: true,
    });
    setMessage("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
    }
  };


  if (!roomId) {
    return (
      <div className="container">
        <header className="header">
          <div className="logo-title">
            <img src="/img.png" alt="Logo" className="logo" />
          </div>
          <a href="/" className="room-link">
            <span>Go to Shortener</span>
          </a>
        </header>

        <main className="main-content">
          <div className="input-container">
            <h2 className="shortened-label">
              Enter Room ID or Create New Room
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinRoom();
              }}
            >
              <input
                type="text"
                className="url-input"
                placeholder="Enter Room ID"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
              />
              <div
                className="button-group"
                style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}
              >
                <button
                  type="submit"
                  className="shorten-btn"
                  style={{ flex: 1 }}
                >
                  Join Room
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="shorten-btn"
                  style={{ flex: 1, backgroundColor: "#2ecc71" }}
                  type="button"
                >
                  Create New Room
                </button>
              </div>
            </form>
          </div>
        </main>

        <footer className="footer">
          <p className="beta-text">Release 2.1</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="logo-title">
          <img src="/img.png" alt="Logo" className="logo" />
        </div>
        <a href="/" className="room-link">
          <span>Go to Shortener</span>
        </a>
      </header>

      <main className="main-content">
        <div className="chat-container">
          <header className="flex items-center justify-between p-4 bg-white border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Room ID: {roomId}</h2>
              <button
                onClick={handleShareRoom}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Copy size={16} />
                <span>{showCopied ? "Copied!" : "Copy Room URL"}</span>
              </button>
            </div>
            {files.length > 0 && (
              <SharedFiles files={files} onDelete={handleFileDelete} />
            )}
          </header>

          <FileDropHandler
            onFileUpload={handleFileUpload}
            maxFiles={20}
            maxSize={15 * 1024 * 1024}
            disabled={isUploading}
          >
            <div className="messages-wrapper">
              <div className="messages-scroll-area">
                <div className="messages-content">
                  {messages.map((msg, index) => (
                    <Message
                      key={index}
                      msg={msg}
                      isOwnMessage={msg.sender === userName}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {uploadingFiles.length > 0 && (
                <div className="uploading-files-container">
                  {uploadingFiles.map((file) => (
                    <FileUploadProgress
                      key={file.id}
                      fileName={file.fileName}
                      progress={Math.round(file.progress)}
                      onCancel={() => cancelUpload(file.id)}
                    />
                  ))}
                </div>
              )}

              <div className="input-container_room">
                <div className="input-area">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="attachment-button"
                  >
                    <PaperclipIcon className="attachment-icon" />
                  </button>
                  <button onClick={handleSendMessage}>Send</button>
                </div>
              </div>
            </div>
          </FileDropHandler>
        </div>
      </main>

      <footer className="footer">
        <p className="beta-text">Release 2.1</p>
      </footer>
    </div>
  );
};

export default Room;
