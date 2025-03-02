import { useState, useEffect } from "react";

function EditForm({ system, onClose, onUpdate }) {
    const [Host, setHost] = useState(system.host);
    const [Username, setUsername] = useState(system.username);
    const [Password, setPassword] = useState(system.password);
    const [Port, setPort] = useState(system.port || "22");

    function NumberInput(e) {
        const value = e.target.value.replace(/\D/g, "");
        setPort(value);
    }

    function UpdateMachine() {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        fetch(`${apiUrl}/api/machine/${encodeURIComponent(system.name)}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ Host, Username, Password, Port }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Update successful:', data);
                if (onUpdate) {
                    onUpdate();
                }
                onClose();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to update machine. Please check SSH credentials and try again.');
            });
    }

    function HandleSubmit(e) {
        e.preventDefault();
        UpdateMachine();
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content FormCard">
                <h2>Edit {system.name}</h2>
                <form onSubmit={HandleSubmit}>
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
                    </label>
                    <br />
                    <div className="button-group">
                        <button type="submit">Save Changes</button>
                        <button type="button" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditForm;