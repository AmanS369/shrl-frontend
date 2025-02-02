import React from "react";
import ReactMarkdown from "react-markdown";

const Message = ({ msg, isOwnMessage }) => {
  const hasMarkdown = msg.isMarkdown && /[*#`>-]/.test(msg.text);

  return (
    <div className={`mb-4 ${isOwnMessage ? "flex justify-end" : ""}`}>
      <div
        className={`inline-block max-w-[70%] p-3 rounded-lg ${
          isOwnMessage ? "bg-blue-500 text-white" : "bg-gray-300"
        }`}
      >
        <p className="font-bold text-sm text-left">{msg.sender}</p>
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
    </div>
  );
};

export default Message;
