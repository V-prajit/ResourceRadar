import MachinesForm from './form';
import SystemDashboard from './cards';

function HomePage(){
    return (
        <div className="BasicPage">
            <SystemDashboard />
            <MachinesForm />
        </div>
    )
}

export default HomePage;