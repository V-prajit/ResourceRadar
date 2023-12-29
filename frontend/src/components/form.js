import { useState, useEffect } from "react";

function MachinesForm() {
    const [Machines, setMachines] = useState(false);

    function getMachine(){
        fetch("http://localhost:3001/")
            .then(response => {
                return response.text();
            })
            .then(data => {
              setMachines(data);
            });
    }
    function createMachine() {
        let name = prompt('Enter machine name');
        let host = prompt('Enter host name');
        let username = prompt('Enter username');
        let password = prompt('Enter password');
        let port = prompt('Enter Port');

        fetch('http://localhost:3001/machines', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({name, host, username, password, port}),
        })
          .then(response => {
            return response.text();
          })
          .then(data => {
            alert(data);
            getMachine();
          });
      }


    useEffect(() => {
    getMachine();
    }, []);
    return (
        <div>
          {Machines ? Machines : 'There is no machine data available'}
          <br />
          <button onClick={createMachine}>Add machine</button>
        </div>
    );
}
export default MachinesForm;
