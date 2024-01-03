import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import SystemUsageDisplay from './components/system_usage';
import MachinesForm from './components/form';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route exact path="/Machines" element={<SystemUsageDisplay />} />
          <Route exact path ="/" element={<MachinesForm />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
