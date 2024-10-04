import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const [isConnected, setIsConnected] = useState(false); // New state to track connection status
    const maxRetries = 5;  // Max number of retries for reconnection
    let retryCount = 0;

    useEffect(() => {
        const init = async () => {
            try {
                socketRef.current = await initSocket();

                // Event listeners for connection errors
                socketRef.current.on('connect_error', handleErrors);
                socketRef.current.on('connect_failed', handleErrors);

                function handleErrors(e) {
                    console.log('Socket error:', e);
                    toast.error('Socket connection failed. Retrying...');
                    retryConnection();  // Retry the connection if failed
                }

                // Join the room
                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                // Event listener for successful joining
                socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                    setIsConnected(true);  // Mark as connected
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                    }
                    setClients(clients);
                    socketRef.current.emit(ACTIONS.SYNC_CODE, {
                        code: codeRef.current,
                        socketId,
                    });
                });

                // Event listener for disconnections
                socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => prev.filter(client => client.socketId !== socketId));
                });

            } catch (error) {
                console.error('Error initializing socket:', error);
                toast.error('Socket initialization failed.');
            }
        };

        // Retry connection function
        const retryConnection = () => {
            if (retryCount < maxRetries) {
                retryCount += 1;
                setTimeout(() => {
                    init();  // Try reconnecting
                }, 2000);  // Wait for 2 seconds before retrying
            } else {
                toast.error('Max retries reached. Could not connect to the server.');
                reactNavigator('/');  // Navigate back to home if it fails
            }
        };

        init();  // Initial socket connection

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
            }
        };
    }, [location.state?.username, reactNavigator, roomId]);

    async function copyRoomId() {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className="mainWrap">
            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src="/code-sync.png"
                            alt="logo"
                        />
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="editorWrap">
                <Editor
                    socketRef={socketRef}
                    roomId={roomId}
                    onCodeChange={(code) => {
                        codeRef.current = code;
                    }}
                />
            </div>
        </div>
    );
};

export default EditorPage;
