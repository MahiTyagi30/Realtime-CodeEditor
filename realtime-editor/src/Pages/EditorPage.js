import React, { useEffect, useRef, useState } from 'react';
import { Client } from '../components/Client';
import { Editor } from '../components/Editor';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import { useLocation, useParams, useNavigate, Navigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';  
import 'react-toastify/dist/ReactToastify.css';  

const EditorPage = () => {
    const codeRef = useRef('');
    const { roomId } = useParams();
    const socketRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate(); 
    const [clients, setClients] = useState([]);

    useEffect(() => {
        const init = async () => {
            try {
                socketRef.current = await initSocket();

                // Handle socket connection errors
                socketRef.current.on('connect_error', handleErrors);
                socketRef.current.on('connect_failed', handleErrors);

                function handleErrors(e) {
                    console.log('Socket error', e);
                    toast.error('Socket connection failed, try again later');
                    navigate('/');  // Navigate to home page on error
                }

                // Emit the JOIN event
                socketRef.current.emit(ACTIONS.JOIN, {
                    roomId,
                    username: location.state?.username,
                });

                // Listen for the JOINED event
                socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room`);
                    }
                    setClients(clients);
                });

                // Listen for the DISCONNECTED event
                socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
                    toast.success(`${username} left the room`);
                    setClients((prev) => prev.filter(client => client.socketId !== socketId));
                });

            } catch (error) {
                console.error('Socket initialization error:', error);
                toast.error('Failed to initialize socket, try again later');
            }
        };

        init();

        return () => {
            if (socketRef.current) {
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.disconnect();
            }
        };
    }, [roomId, location.state?.username, navigate]);

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    };

    const leaveRoom = () => {
        navigate('/');
    };

    if (!location.state) {
        return <Navigate to="/" />;
    }

    return (
        <div className='mainWrap'>
            <div className='aside'>
                <div className='asideInner'>
                    <div className='logo'>
                        <img className='logoImage' src='/image.png' alt='logo' />
                    </div>
                    <h3>Connected</h3>
                    <div className='clientsList'>
                        {clients.map((client) => (
                            <Client key={client.socketId} username={client.username} />
                        ))}
                    </div>
                </div>
                <button className='btn copyBtn' onClick={copyRoomId}>Copy ROOM ID</button>
                <button className='btn leaveBtn' onClick={leaveRoom}>Leave</button>
            </div>
            <div className='editorWrap'>
                <Editor socketRef={socketRef} roomId={roomId} onCodeChange={(code) => { codeRef.current = code; }} />
            </div>
            <ToastContainer />
        </div>
    );
};

export default EditorPage;
