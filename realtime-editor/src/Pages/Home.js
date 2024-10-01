import React, { useState } from 'react'
import {v4 as uuidv4} from 'uuid';
// import {toast} from 'react-toastify';
import { useNavigate } from 'react-router-dom';
const Home = () =>{
    const navigate=useNavigate();
    const [roomId, setRoomId]=useState('');
    const [username, setUsername]=useState('');
    const [error, setError] = useState(''); 


     const createNewRoom = (e) =>{
        e.preventDefault();
        const id= uuidv4();
        setRoomId(id);
     // toast.success('Created a new room')

        console.log(id);
     }

     const joinRoom = () =>{
        let errorMessage = '';
        if (!roomId || !username) {
            errorMessage = 'Room ID and Username are required.';
        }

        if (errorMessage) {
            setError(errorMessage); // Set the error message if there's any
        } 
       navigate('/editor/${roomId}',{
        state:{
            username,
        }
       })

        

        
        
     }

     const handleInputEnter = (e) =>{
        if(e.code === 'Enter'){
            joinRoom();
        }
     }
    return <div className='homePageWrapper'>
       <div className='formWrapper'>
            <img  className="homePageLogo" src="/image.png" alt='image'/>
            <h4 className='mainLabel'>PASTE INVITATION ROOM ID</h4>
            <div className='inputGroup'>
                <input type='text'
                className='inputBox'
                placeholder='Room ID'
                onChange={(e)=>setRoomId(e.target.value)}
                value={roomId}
                onKeyUp={handleInputEnter}
                />
                <input type='text'
                className='inputBox'
                placeholder='USERNAME'
                onChange={(e)=>setUsername(e.target.value)}
                value={username}
                onKeyUp={handleInputEnter}
                />
                <button className='btn joinBtn' onClick={joinRoom}>Join</button>
                <span className='createInfo'>
                    If you don't have an invite then create &nbsp;
                    <a onClick={createNewRoom} href='' className='createNewBtn'>
                        new room
                    </a>
                </span>
            {error && <p className='error'>{error}</p>}

            </div>
       </div>
       <footer>
        <h4>Built with 💛 by <a href='https://github.com/MahiTyagi30'>Mahi Tyagi</a> </h4>
       </footer>
        </div>
}

export default Home;