import logo from './logo.svg';
import React, { createContext  } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Calendar from './Pages/Calendar';
import Diary from './Pages/Diary';

// export const AppContext = createContext();

// // read local json file "./fake_data.json"
// const server_data = require('./fake_data.json');
// // console.log(fake_data["sehoon1106"])

function App() {
  return (
      <div className="App">
        <BrowserRouter>
          <header className="App-header"/>
          <Routes>
            <Route path="/:user_id" element={<Calendar />} />
            <Route path="/:user_id/:date" element={<Diary />} />
          </Routes>
        </BrowserRouter>
      </div>
  );
}

export default App;
