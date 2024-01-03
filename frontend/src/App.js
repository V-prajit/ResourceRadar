import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import MachinesForm from './components/form';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route exact path ="/" element={<MachinesForm />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
