import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { socket } from './sockect';

function App() {
  const [username, setUsername] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [online, setOnline] = useState([]);
  const [typing, setTyping] = useState('');
  const [notif, setNotif] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    socket.on('message', msg => setMessages(m => [...m, msg]));
    socket.on('private_message', msg => setPrivateMessages(m => [...m, msg]));
    socket.on('online', setOnline);
    socket.on('typing', setTyping);
    socket.on('stopTyping', () => setTyping(''));
    socket.on('notification', setNotif);
    return () => socket.disconnect();
  }, []);

  const handleLogin = () => {
    if (username) {
      socket.connect();
      socket.emit('login', username);
    }
  };

  const sendMessage = () => {
    if (!input) return;
    if (selectedUser && selectedUser !== username) {
      const msg = { from: username, to: selectedUser, text: input, time: new Date().toLocaleTimeString() };
      socket.emit('private_message', msg);
      setPrivateMessages(m => [...m, msg]);
    } else {
      socket.emit('message', { user: username, text: input });
    }
    setInput('');
    socket.emit('stopTyping');
  };

  return (
    <div className="chat-container">
      {!socket.connected ? (
        <div className="login">
          <h2>Join Chat</h2>
          <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <button onClick={handleLogin}>Enter</button>
        </div>
      ) : (
        <div className="chat-box">
          <div className="sidebar">
            <h3>Online</h3>
            <ul>
              {online.map(u => (
                <li
                  key={u}
                  style={{
                    fontWeight: selectedUser === u ? 'bold' : 'normal',
                    cursor: u !== username ? 'pointer' : 'default',
                    color: u === username ? '#888' : '#000'
                  }}
                  onClick={() => u !== username && setSelectedUser(u)}
                >
                  {u} {u === username && '(You)'}
                </li>
              ))}
            </ul>
            <button onClick={() => setSelectedUser('')}>Global Chat</button>
            <div style={{ fontSize: '0.9em', marginTop: 8 }}>
              {selectedUser && selectedUser !== username
                ? `Private chat with ${selectedUser}`
                : 'Global chat'}
            </div>
          </div>
          <div className="main">
            <div className="messages">
              {selectedUser && selectedUser !== username
                ? privateMessages
                    .filter(
                      m =>
                        (m.from === username && m.to === selectedUser) ||
                        (m.from === selectedUser && m.to === username)
                    )
                    .map((m, i) => (
                      <div key={i} className={m.from === username ? 'me' : ''}>
                        <b>{m.from}</b>: {m.text} <span>{m.time}</span>
                      </div>
                    ))
                : messages.map((m, i) => (
                    <div key={i} className={m.user === username ? 'me' : ''}>
                      <b>{m.user}</b>: {m.text} <span>{m.time}</span>
                    </div>
                  ))}
              {notif && <div className="notif">{notif}</div>}
              {typing && <div className="typing">{typing} is typing...</div>}
            </div>
            <div className="input-area">
              <input
                ref={inputRef}
                value={input}
                placeholder={
                  selectedUser && selectedUser !== username
                    ? `Message @${selectedUser}`
                    : 'Type a message...'
                }
                onChange={e => {
                  setInput(e.target.value);
                  socket.emit('typing', username);
                  if (!e.target.value) socket.emit('stopTyping');
                }}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                onBlur={() => socket.emit('stopTyping')}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;