import { useState, useEffect } from "react";

function MachinesForm() {
    const [Machines, setMachines] = useState(false);
    const [Name, setName] = useState("");
    const [Host, setHost] = useState("");
    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [Port, setPort] = useState("22");
    const [isOpen, setIsOpen] = useState(false);

    function GetMachine(){
        fetch("http://localhost:3001/")
            .then(response => {
                return response.text();
            })
            .then(data => {
              setMachines(data);
            });
    }

    function NumberInput(e){
        const value = e.target.value.replace(/\D/g, "");
        setPort(value);
    }

    function CreateMachine(){
      fetch('http://localhost:3001/sshverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Name, Host, Username, Password, Port}),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text();
        })
        .then(data => {
          console.log(data);
          GetMachine();
        })
        .catch(error => {
          if (error.message.includes("already exists")) {
            alert("A machine with this name already exists. Please choose a different name.");
          } else {
            console.error('Error:', error);
          }
        });
    }

    function HandleSubmit(e) {
        e.preventDefault();
        CreateMachine();
        console.log('HandleSubmit called');
        setIsOpen(false);
        setName("");
        setPassword("");
        setUsername("");
        setPort("22");
        setHost("");
    }


    return (
        <div>
          <br />
          <button className = "ButtonCard" onClick={ () => { setIsOpen(!isOpen)}}>Add machine</button>
          { isOpen && (
            <div className="FormCard system-cards">
                <form onSubmit={HandleSubmit}>
                    <label>
                        Host Name:
                        <input 
                        type="text" 
                        value={Name} 
                        onChange={(event) => setName(event.target.value)} />
                    </label>
                    <br />
                    <label>
                        Host IP:
                        <input 
                        type="text" 
                        value={Host}
                        onChange={(event) => setHost(event.target.value)} />
                    </label>
                    <br />
                    <label>
                        SSH Username:
                        <input 
                        type="text" 
                        value={Username} 
                        onChange={(event) => setUsername(event.target.value)} />
                    </label>
                    <br />
                    <label>
                        SSH Password:
                        <input 
                        type="text" 
                        value={Password} 
                        onChange={(event) => setPassword(event.target.value)} />
                    </label>
                    <br />
                    <label>
                        SSH Port:
                        <input 
                        type="text" 
                        value={Port} 
                        onChange={NumberInput} />
                        (DEFAULT, Do not change if you don't know what it is.)
                    </label>
                    <br />
                    <button type = "submit">Save New Machine</button>
                </form>
            </div>
          )}
        </div>
    );
}
export default MachinesForm;
