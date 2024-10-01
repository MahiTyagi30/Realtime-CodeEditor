import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css'; // Ensure you include the base CSS
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

export const Editor = ({ socketRef, roomId, onCodeChange }) => {

    const editorRef = useRef(null);

    useEffect(() => {
        editorRef.current = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
            mode: { name: 'javascript', json: true },
            theme: 'dracula',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
        });

        const handleCodeChange = (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange(code);

            if (origin !== 'setValue') {
                socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
            }
        };

        editorRef.current.on('change', handleCodeChange);

        return () => {
            editorRef.current.off('change', handleCodeChange);
        };
    }, [socketRef, roomId, onCodeChange]);

    useEffect(() => {
        if (socketRef.current) {
            const handleCodeChange = ({ code }) => {
                if (code !== null) {
                    editorRef.current.setValue(code);
                }
            };

            socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

            return () => {
                socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
            };
        }
    }, [socketRef]);

    return <textarea id="realtimeEditor"></textarea>;
};
