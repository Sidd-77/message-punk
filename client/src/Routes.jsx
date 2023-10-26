
import RegisterandLoginForm from "./RegisterandLoginForm";
import { useContext } from "react";
import { UserContext } from "./UserContext.jsx";
//import { Chat } from "./Chat.jsx";
import Chat from "./Chat";

export function Routes(){
    const {userName, id} = useContext(UserContext);

    if(userName){
        return <Chat />
    }

    return (
        <RegisterandLoginForm />
    )
}