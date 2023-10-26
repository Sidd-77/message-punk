import axios from "axios";
import { useState, useContext } from "react"
import {UserContext} from './UserContext.jsx';

export default function RegisterandLoginForm(){

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoginorRegister, setisLoginorRegister] = useState('register');
    const {setuserName:setLonggedInUname, setId} = useContext(UserContext);

    const handleSubmit = async (e)=>{

        let url = isLoginorRegister==='register'?'/register':'/login';

        e.preventDefault();
        const {data} = await axios.post(url,{username,password});
        console.log(data);
        setLonggedInUname(username);
        setId(data._id);
    }

    return(
        <div className=" bg-blue-100 h-screen flex items-center">
            <form onSubmit={handleSubmit} className="w-80 mx-auto ">

                <input type="text" value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Username"
                    className="rounded-md block w-full p-2 mb-4"/>

                <input type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    className="block rounded-md w-full p-2 mb-4"/>

                <button className=" bg-blue-600 text-white w-full rounded-md p-2">{isLoginorRegister==='register'? 'Register':'Login'}</button>
                {isLoginorRegister==='register'?(
                    <div className="text-center mt-2">
                        Already a member? <button onClick={(e)=> {
                            e.preventDefault();
                            setisLoginorRegister('login');
                        }}>Login here</button>
                    </div>
                ):(
                    <div className="text-center mt-2">
                        New herer? <button onClick={(e)=> {
                            e.preventDefault();
                            setisLoginorRegister('register')
                        }}>Register here</button>
                    </div>
                )}
                
            </form>
        </div>

    )
}