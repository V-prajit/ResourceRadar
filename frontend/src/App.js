import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import HomePage from './components/homepage';
import MachinesForm from './components/form';
import SystemDashboard from './components/cards';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route exact path ="/" element={<HomePage />} />
          <Route exact path ="/test" element={<MachinesForm />} />
          <Route exact path ="/test2" element={<SystemDashboard />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
