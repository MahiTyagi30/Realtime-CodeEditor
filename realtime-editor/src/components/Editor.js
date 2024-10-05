import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../Actions';

const Editor = ({ socketRef, roomId }) => {
    const editorRef = useRef(null);
    const currentUser = useRef(null); // Track the current user to prevent self-triggering

    useEffect(() => {
        async function init() {
            editorRef.current = Codemirror.fromTextArea(
                document.getElementById('realtimeEditor'),
                {
                    mode: { name: 'javascript', json: true },
                    theme: 'dracula',
                    autoCloseTags: true,
                    autoCloseBrackets: true,
                    lineNumbers: true,
                }
            );

            // Initialize current user
            currentUser.current = socketRef.current.id; // Assuming you set the socket ID as the user ID

            editorRef.current.on('change', (instance, changes) => {
                const { origin } = changes;
                const code = instance.getValue();

                if (origin !== 'setValue') {
                    // Emit code change only if it's from the current user
                    socketRef.current.emit(ACTIONS.CODE_CHANGE, {
                        roomId,
                        code,
                        userId: currentUser.current,
                    });
                }
            });
        }
        init();
    }, [socketRef, roomId]);

    useEffect(() => {
        if (socketRef.current) {
            socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code, userId }) => {
                // Update the editor only if the change is from another user
                if (userId !== currentUser.current) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE);
        };
    }, [socketRef]);

    return <textarea id="realtimeEditor"></textarea>;
};

export default Editor;
