"use client";
import React, { useState, useEffect, useRef } from "react";
import Vapi from "@vapi-ai/web";

interface VapiWidgetProps {
  apiKey: string;
  assistantId: string;
  config?: Record<string, unknown>;
}

interface TypingState {
  isTyping: boolean;
  displayText: string;
  fullText: string;
}

const VapiWidget: React.FC<VapiWidgetProps> = ({
  apiKey,
  assistantId,
  config = {},
}) => {
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ role: string; text: string; timestamp?: number }>
  >([]);
  const [typingStates, setTypingStates] = useState<Record<number, TypingState>>(
    {}
  );
  const transcriptRef = useRef<HTMLDivElement>(null);

  const [messageBuffer, setMessageBuffer] = useState<{
    role: string;
    text: string;
    timer?: NodeJS.Timeout;
  } | null>(null);

  useEffect(() => {
    const vapiInstance = new Vapi(apiKey);
    setVapi(vapiInstance);

    // Event listeners
    vapiInstance.on("call-start", () => {
      console.log("Call started");
      setIsConnected(true);
    });

    vapiInstance.on("call-end", () => {
      console.log("Call ended");
      setIsConnected(false);
      setIsSpeaking(false);
    });

    vapiInstance.on("speech-start", () => {
      console.log("Assistant started speaking");
      setIsSpeaking(true);
    });

    vapiInstance.on("speech-end", () => {
      console.log("Assistant stopped speaking");
      setIsSpeaking(false);
    });

    vapiInstance.on("message", message => {
      if (message.type === "transcript") {
        if (messageBuffer && messageBuffer.role === message.role) {
          // Clear existing timer
          if (messageBuffer.timer) {
            clearTimeout(messageBuffer.timer);
          }

          // Set new timer
          const timer = setTimeout(() => {
            setTranscript(prev => [...prev, messageBuffer]);
            setMessageBuffer(null);
          }, 1000);

          // Update buffer
          setMessageBuffer({
            role: message.role,
            text: messageBuffer.text + " " + message.transcript,
            timer,
          });
        } else {
          // If there's a pending buffer, add it to transcript
          if (messageBuffer) {
            setTranscript(prev => [...prev, messageBuffer]);
          }

          // Start new buffer
          const timer = setTimeout(() => {
            setTranscript(prev => [
              ...prev,
              {
                role: message.role,
                text: message.transcript,
              },
            ]);
            setMessageBuffer(null);
          }, 1000);

          setMessageBuffer({
            role: message.role,
            text: message.transcript,
            timer,
          });
        }
      }
    });

    vapiInstance.on("error", error => {
      console.error("Vapi error:", error);
    });

    return () => {
      vapiInstance?.stop();
    };
  }, [apiKey]);

  useEffect(() => {
    const animateLatestMessage = async () => {
      const lastIndex = transcript.length - 1;
      if (lastIndex >= 0) {
        const message = transcript[lastIndex];
        setTypingStates(prev => ({
          ...prev,
          [lastIndex]: {
            isTyping: true,
            displayText: "",
            fullText: message.text,
          },
        }));

        for (let i = 0; i <= message.text.length; i++) {
          setTypingStates(prev => ({
            ...prev,
            [lastIndex]: {
              ...prev[lastIndex],
              displayText: message.text.substring(0, i),
            },
          }));
          await new Promise(resolve => setTimeout(resolve, 30));
        }

        setTypingStates(prev => ({
          ...prev,
          [lastIndex]: { ...prev[lastIndex], isTyping: false },
        }));
      }
    };

    animateLatestMessage();
  }, [transcript]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const startCall = () => {
    if (vapi) {
      vapi.start(assistantId);
    }
  };

  const endCall = () => {
    if (vapi) {
      vapi.stop();
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {!isConnected ? (
        <button
          onClick={startCall}
          style={{
            background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",
            color: "#fff",
            border: "1px solid #3a3a3a",
            borderRadius: "50px",
            padding: "20px 40px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
            width: "100%",
            maxWidth: "400px",
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 16px rgba(18, 165, 148, 0.4)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 12px rgba(18, 165, 148, 0.3)";
          }}
        >
          🎤 Sandra is Ready to Speak with You
        </button>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "20px",
            width: "100%",
            maxWidth: "600px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
            border: "1px solid #e1e5e9",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            height: "600px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: isSpeaking ? "#ff4444" : "#12A594",
                  animation: isSpeaking ? "pulse 1s infinite" : "none",
                }}
              ></div>
              <span style={{ fontWeight: "bold", color: "#333" }}>
                {isSpeaking ? "Assistant Speaking..." : "Listening..."}
              </span>
            </div>
            <button
              onClick={endCall}
              style={{
                background: "#ff4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              End Call
            </button>
          </div>

          <div
            ref={transcriptRef}
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: "12px",
              padding: "8px",
              background: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            {transcript.length === 0 ? (
              <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
                Conversation will appear here...
              </p>
            ) : (
              transcript.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: "8px",
                    textAlign: msg.role === "user" ? "right" : "left",
                  }}
                >
                  <span
                    style={{
                      background: msg.role === "user" ? "#12A594" : "#333",
                      color: "#fff",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      display: "inline-block",
                      fontSize: "14px",
                      maxWidth: "80%",
                    }}
                  >
                    {typingStates[i]?.displayText || msg.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VapiWidget;
