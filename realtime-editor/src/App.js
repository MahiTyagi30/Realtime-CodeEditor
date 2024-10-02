// import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { ToastContainer } from 'react-toastify';
import './App.css';
import Home from './Pages/Home';
import EditorPage from './Pages/EditorPage';

function App() {
  return (
    <>
<Router>
  <Routes>
    <Route path='/' element={<Home/>}></Route>
    <Route path='/editor/:roomId' element={<EditorPage/>}></Route>

  </Routes>
</Router>

    </>
  );
}

export default App;
