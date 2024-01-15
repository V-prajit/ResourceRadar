import React from 'react';
import { useParams } from 'react-router-dom';

function SystemDetails(){
    const { host } = useParams();

    return(
        <div>
            <p>The details of the system is {host}</p>
        </div>
    )
}

export default SystemDetails;