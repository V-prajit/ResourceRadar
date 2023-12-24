import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SystemUsageDisplay from './components/cpu_usage';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route exact path="/Machines" element={<SystemUsageDisplay />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
