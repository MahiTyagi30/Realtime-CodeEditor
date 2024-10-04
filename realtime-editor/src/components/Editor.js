import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId, onCodeChange }) => {
    const editorRef = useRef(null);

    useEffect(() => {
        // Initialize CodeMirror
        const initEditor = () => {
            editorRef.current = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
                mode: { name: 'javascript', json: true },
                theme: 'dracula',
                autoCloseTags: true,
                autoCloseBrackets: true,
                lineNumbers: true,
            });

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();
                onCodeChange(code); // Call the onCodeChange function with the new code
                
                // Emit code change only if it wasn't caused by setting the value
                if (origin !== 'setValue') {
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                    });
                }
            });
        };

        initEditor();

        // Cleanup on component unmount
        return () => {
            if (editorRef.current) {
                editorRef.current.toTextArea(); // Clean up CodeMirror instance
                editorRef.current = null; // Clear the reference
            }
        };
    }, [onCodeChange, roomId]); // Ensure onCodeChange is updated if it changes

    useEffect(() => {
        if (socketRef.current) {
            // Listen for code changes from other clients
            const handleCodeChange = ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            };

            socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

            // Cleanup the socket listener on unmount
            return () => {
                socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
            };
        }
    }, [socketRef]); // Only run this effect when socketRef changes

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
