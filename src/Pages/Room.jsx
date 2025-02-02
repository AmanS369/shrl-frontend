import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import FileDropHandler from "../Component/FileDropHandler";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { PaperclipIcon, Copy } from "lucide-react";
import SharedFiles from "../Component/SharedFile";
import FileUploadProgress from "../Component/FileUploadProgress";
import Message from "../Component/Message";
const Room = () => {
  // Existing state management
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [userName, setUserName] = useState(
    () => localStorage.getItem("chatUserName") || "",
  );
  const [isNameSet, setIsNameSet] = useState(false);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const [showCopied, setShowCopied] = useState(false);

  // Get URL parameters and navigation
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlRoomId = params.get("roomId");
    if (urlRoomId) {
      setInputRoomId(urlRoomId);
      // Don't automatically join - wait for name input
      if (isNameSet && !roomId) {
        handleJoinRoom(urlRoomId);
      }
    }
  }, [location, isNameSet]);

  // Refs
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-resize textarea function
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

  // Config
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(API_URL, { transports: ["websocket"] });
    setSocket(socketInstance);
    return () => socketInstance.disconnect();
  }, [API_URL]);

  // Socket event handlers
  // In Room.jsx's useEffect for socket events
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

  // Then in the handleFileSelect function:
  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 15 * 1024 * 1024) {
      alert("File size must be less than 15MB");
      return;
    }

    if (files.length >= 20) {
      alert("Maximum file limit reached (20 files)");
      return;
    }

    try {
      setIsUploading(true);
      const fileId = `${roomId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileId);

      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
      setUploadingFiles((prev) => [
        ...prev,
        {
          id: fileId,
          fileName: file.name,
          progress: 0,
        },
      ]);

      // Send file message - no need to manually update files state here
      // as it will be updated through the socket event
      socket.emit("sendMessage", {
        roomId,
        sender: userName,
        text: `Shared a file: ${file.name}`,
        fileInfo: {
          fileName: file.name,
          fileUrl,
        },
      });

      fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };
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

  const handleFileDownload = async (file) => {
    try {
      // Add CORS headers to the request
      const response = await fetch(file.fileUrl, {
        headers: {
          Origin: window.location.origin,
        },
        mode: "cors", // Explicitly set CORS mode
      });

      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };
  const handleFileDelete = async (file) => {
    socket.emit("deleteFile", { roomId, fileUrl: file.fileUrl });
  };

  // Room management
  const handleCreateRoom = async () => {
    try {
      const response = await axios.post(`${API_URL}create`);
      const newRoomId = response.data.room.roomId;
      setRoomId(newRoomId);
      // Update URL with room ID
      navigate(`?roomId=${newRoomId}`, { replace: true });
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room. Please try again.");
    }
  };
  const handleJoinRoom = async (roomIdToJoin = inputRoomId) => {
    if (!roomIdToJoin.trim()) return;
    try {
      const response = await axios.get(`${API_URL}join/${roomIdToJoin}`);
      setRoomId(response.data.room.roomId);
      // Update URL with room ID if it's not already there
      if (!location.search.includes(roomIdToJoin)) {
        navigate(`?roomId=${roomIdToJoin}`, { replace: true });
      }
    } catch (error) {
      console.error("Error joining room:", error);
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

  // Message handling
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
  // User name handling
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem("chatUserName", userName);
      setIsNameSet(true);
    }
  };

  // Render name input form
  if (!isNameSet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">
            Enter your name to continue
          </h2>
          {inputRoomId && (
            <p className="text-gray-600 mb-4">
              You're joining room: {inputRoomId}
            </p>
          )}
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-2 border rounded"
              maxLength={30}
            />
            <button
              type="submit"
              className="w-full p-2 bg-blue-500 text-white rounded"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!roomId && !inputRoomId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md space-y-4">
          <div className="text-center">
            <p className="text-lg">Welcome, {userName}!</p>
            <button
              onClick={() => setIsNameSet(false)}
              className="text-sm text-blue-500 hover:underline"
            >
              Change Name
            </button>
          </div>
          <button
            onClick={handleCreateRoom}
            className="w-full p-2 bg-blue-500 text-white rounded"
          >
            Create New Room
          </button>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              className="w-full p-2 border rounded"
            />
            <button
              onClick={() => handleJoinRoom()}
              className="w-full p-2 bg-green-500 text-white rounded"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render chat room
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Room ID: {roomId}</h2>
            <button
              onClick={handleShareRoom}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
            >
              <Copy size={16} />
              {showCopied ? "Copied!" : "Share"}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span>Chatting as: {userName}</span>
            <button
              onClick={() => setIsNameSet(false)}
              className="text-sm hover:underline"
            >
              Change Name
            </button>
          </div>
        </div>
      </div>

      <FileDropHandler
        onFileUpload={handleFileUpload}
        maxFiles={20}
        maxSize={15 * 1024 * 1024}
        disabled={isUploading}
      >
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)]">
          {/* Shared Files Section */}
          <div className="p-4 border-b bg-white">
            <SharedFiles files={files} onDelete={handleFileDelete} />
          </div>

          {/* Messages Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">
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

          {/* Message Input Section - Now fixed at bottom */}
          <div className="border-t bg-white p-4 w-full">
            <div className="flex gap-2">
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
                className="flex-1 p-2 border rounded resize-none min-h-[40px] max-h-[200px]"
                rows={1}
              />
              <div className="flex flex-col justify-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  <PaperclipIcon className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </FileDropHandler>

      {/* Upload Progress Indicators */}
      <div className="fixed bottom-0 right-0 p-4 space-y-2">
        {uploadingFiles.map((file) => (
          <FileUploadProgress
            key={file.id}
            fileName={file.fileName}
            progress={Math.round(file.progress)}
            onCancel={() => cancelUpload(file.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Room;
