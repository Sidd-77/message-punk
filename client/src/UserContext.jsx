import axios from "axios";
import { useEffect, useState } from "react";

import { createContext } from 'react';


export const UserContext = createContext({});

export function UserContextProvider({children}){

    const [userName, setuserName] = useState(null);
    const [id, setId] = useState(null);

    useEffect(()=>{
        axios.get('/profile').then(response => {
            setId(response.data.userId);
            setuserName(response.data.username);
        })
    },[])

    return (
        <UserContext.Provider value={{userName, setuserName, id, setId}}>
            {children}
        </UserContext.Provider>
    )
}