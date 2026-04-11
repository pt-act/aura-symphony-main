/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import c from 'classnames';
import React, {useEffect, useRef, useState} from 'react';
import type {ChatMessage, Insight} from '../../../types';

interface ChatContentProps {
  insight: Insight;
  onSendMessage: (
    insightId: number,
    history: ChatMessage[],
    message: string,
    file?: File,
  ) => void;
}

export default function ChatContent({insight, onSendMessage}: ChatContentProps) {
  const [userMessage, setUserMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [insight.data]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userMessage.trim() || selectedFile) {
      onSendMessage(insight.id, insight.data, userMessage, selectedFile || undefined);
      setUserMessage('');
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="chat-insight">
      <div className="chat-history" ref={chatScrollRef}>
        {insight.data.map((msg: ChatMessage, index: number) => (
          <div key={index} className={c('chat-message', msg.role)}>
            <div className="message-content">
              {msg.file && (
                <div className="file-attachment-preview">
                  {msg.file.mimeType.startsWith('image/') ? (
                    <img src={msg.file.dataUrl} alt={msg.file.name} />
                  ) : (
                    <div className="file-icon">
                      <span className="icon">description</span>
                      <span>{msg.file.name}</span>
                    </div>
                  )}
                </div>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {insight.isLoading && (
          <div className="chat-message model">
            <div className="message-content loading">...</div>
          </div>
        )}
      </div>
      <form className="chat-input-form" onSubmit={handleChatSubmit}>
        {selectedFile && (
          <div className="file-attachment-chip">
            <span className="icon">attachment</span>
            {selectedFile.name}
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}>
              &times;
            </button>
          </div>
        )}
        <input
          type="text"
          value={userMessage}
          onChange={(e) => setUserMessage(e.target.value)}
          placeholder="Ask a follow-up or attach a file..."
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,application/pdf"
          style={{display: 'none'}}
        />
        <button
          type="button"
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}>
          <span className="icon">attachment</span>
        </button>
        <button type="submit" className="send-button">
          <span className="icon">send</span>
        </button>
      </form>
    </div>
  );
}