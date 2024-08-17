import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import "./Chat.css";

const Room = () => {
  const [roomId, setRoomId] = useState("");
  const [inputRoomId, setInputRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const socketInstance = io(API_URL, {
      transports: ["websocket"], // Ensure WebSocket is used
      upgrade: false,
    });

    setSocket(socketInstance);

    // Cleanup on component unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [API_URL]);

  useEffect(() => {
    if (socket && roomId) {
      socket.emit("joinRoom", roomId);

      socket.on("loadMessages", (loadedMessages) => {
        setMessages(loadedMessages);
      });

      socket.on("receiveMessage", (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      // Handle socket connection errors
      socket.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
      });

      // Attempt to reconnect if the socket disconnects
      socket.on("disconnect", () => {
        console.log("Socket disconnected. Attempting to reconnect...");
        socket.connect();
      });
    }
  }, [socket, roomId]);

  const handleCreateRoom = async () => {
    try {
      const response = await axios.post(`${API_URL}create`);
      setRoomId(response.data.room.roomId);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const handleJoinRoom = async () => {
    try {
      const response = await axios.get(`${API_URL}join/${inputRoomId}`);
      setRoomId(response.data.room.roomId);
      setMessages(response.data.room.messages);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      socket.emit("sendMessage", { roomId, sender: "User", text: message });
      setMessage("");
    }
  };

  return (
    <div className="chat-container">
      {!roomId ? (
        <div className="room-selection">
          <button onClick={handleCreateRoom}>Create Room</button>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={inputRoomId}
            onChange={(e) => setInputRoomId(e.target.value)}
          />
          <button onClick={handleJoinRoom}>Join Room</button>
        </div>
      ) : (
        <div className="chat-room">
          <div className="room-header">
            <h2>Room ID: {roomId}</h2>
          </div>
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <strong>{msg.sender}: </strong>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="input-container_room">
            <input
              type="text"
              placeholder="Enter message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Room;
