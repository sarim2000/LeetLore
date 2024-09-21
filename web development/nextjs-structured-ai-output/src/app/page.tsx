"use client";

import { useState, useEffect } from "react";
import { streamNewsUpdates } from "./actions";
import { readStreamableValue } from "ai/rsc";

type NewsItem = {
  headline: string;
  category: 'Politics' | 'Technology' | 'Sports' | 'Entertainment' | 'Science';
  timestamp: string;
  summary: string;
};

type NewsList = {
  newsItem: NewsItem[];
};

const getCategoryBgColor = (category: string) => {
  switch (category) {
    case 'Politics':
      return 'bg-blue-500';
    case 'Technology':
      return 'bg-green-500';
    case 'Sports':
      return 'bg-red-500';
    case 'Entertainment':
      return 'bg-yellow-500';
    case 'Science':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};


export default function Home() {
  const [newsList, setNewsList] = useState<NewsList>({ newsItem: [] });
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const streamNews = async () => {
      const {object} = await streamNewsUpdates();
      
      for await (const partialObject of readStreamableValue(object)) {
        if (!isMounted) break;
        if (partialObject.newsItem) {
          setNewsList((prev) => ({
            newsItem: partialObject.newsItem
          }));
        }
      }

      setIsStreaming(false);
    };

    if (isStreaming) {
      streamNews();
    }

    return () => {
      isMounted = false;
    };
  }, [isStreaming]);

  return (
    <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-800 animate-pulse">
        Streaming Structured Response Demo
      </h1>
      <div className="flex justify-center mb-6">
        <button
          className={`${
            isStreaming ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'
          } text-white font-bold py-3 px-6 rounded-full transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          onClick={() => setIsStreaming(!isStreaming)}
        >
          {isStreaming ? "Stop Streaming" : "Start Streaming"}
        </button>
      </div>
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {newsList.newsItem.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden transition duration-300 ease-in-out transform hover:scale-105">
            <div className={`p-2 text-white font-semibold ${getCategoryBgColor(item.category)}`}>
              {item.category}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2 text-gray-800">{item.headline}</h2>
              <p className="text-sm text-gray-600 mb-3">{item.timestamp}</p>
              <p className="text-gray-700">{item.summary}</p>
            </div>
          </div>
        ))}
      </div>
      {newsList.newsItem.length === 0 && (
        <div className="text-center text-gray-600 mt-8">
          {isStreaming ? "Waiting for news updates..." : "Click 'Start Streaming' to begin"}
        </div>
      )}
    </div>
  );
}
