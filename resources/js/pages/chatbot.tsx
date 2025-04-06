import { useState, useEffect, useRef } from "react";
import { Head } from "@inertiajs/react";
import { Send, Bot } from "lucide-react";

export default function Chatbot() {
    const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userInput = input;
        setInput("");
        setMessages((prev) => [...prev, { sender: "user", text: userInput }]);
        setIsTyping(true);

        try {
            const response = await fetch("http://127.0.0.1:5000/chat", {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userInput }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            await typeResponse(data.reply || "I couldn't understand that.");
        } catch (error) {
            console.error("Fetch error:", error);
            setMessages((prev) => [...prev, { sender: "ai", text: "Error: Unable to process your request." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const typeResponse = async (fullText: string) => {
        const words = fullText.split(" ");
        let currentText = "";
        setMessages((prev) => [...prev, { sender: "ai", text: "" }]);

        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? " " : "") + words[i];
            setMessages((prev) => [
                ...prev.slice(0, -1),
                { sender: "ai", text: currentText },
            ]);
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <Head title="Chatbot" />
            <div className="w-full max-w-3xl bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bot className="w-6 h-6 text-blue-400" /> LeeAI
                </h1>
                <div className="mt-4 h-[25rem] overflow-y-auto p-4 space-y-3 bg-gray-700 rounded-lg">
                    {messages.length === 0 ? (
                        <p className="text-gray-400 text-center">Start a conversation...</p>
                    ) : (
                        messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                                <p
                                    className={`px-4 py-2 rounded-md text-sm ${msg.sender === "user" ? "bg-blue-500 text-white" : "bg-gray-600 text-white"}`}
                                >
                                    {msg.text}
                                </p>
                            </div>
                        ))
                    )}
                    {isTyping && (
                      <div className="text-gray-400 text-center animate-[bounce_1.5s_infinite]">
                            LeeAI is typing...
                        </div>
                    )}
                    <div ref={messagesEndRef}></div>
                </div>
                <div className="mt-4 flex items-center border border-gray-700 rounded-xl bg-gray-900 px-4 py-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-transparent text-white focus:outline-none placeholder-gray-400 text-sm"
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        className="ml-2 bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 flex items-center justify-center"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}