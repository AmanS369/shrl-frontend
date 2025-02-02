import React, { useState } from "react";
import ReactMarkdown from "react-markdown";

const Message = ({ msg, isOwnMessage }) => {
  const hasMarkdown = msg.isMarkdown && /[*#`>-]/.test(msg.text);
  const [avatarError, setAvatarError] = useState(false);

  // Generate consistent avatar URL based on sender's name
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
    msg.sender,
  )}`;

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  return (
    <div className="mb-4">
      {/* Sender name above message */}
      <div className={`mb-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full inline-flex items-center">
          {msg.sender}
        </span>
      </div>

      {/* Message content with avatar */}
      <div className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
        {!isOwnMessage && !avatarError && (
          <div className="flex-shrink-0 mr-2">
            <img
              src={avatarUrl}
              alt={msg.sender}
              className="w-8 h-8 rounded-full bg-gray-200"
              onError={handleAvatarError}
            />
          </div>
        )}
        <div
          className={`inline-block max-w-[70%] p-3 rounded-lg ${
            isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-300"
          }`}
        >
          <div
            className={`break-words text-left ${
              isOwnMessage && hasMarkdown
                ? "prose prose-invert prose-p:text-white prose-headings:text-white prose-strong:text-white prose-em:text-white"
                : "prose"
            }`}
          >
            {hasMarkdown ? (
              <ReactMarkdown>{msg.text}</ReactMarkdown>
            ) : (
              <p className="whitespace-pre-wrap m-0">{msg.text}</p>
            )}
          </div>
        </div>
        {isOwnMessage && !avatarError && (
          <div className="flex-shrink-0 ml-2">
            <img
              src={avatarUrl}
              alt={msg.sender}
              className="w-8 h-8 rounded-full bg-gray-200"
              onError={handleAvatarError}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
