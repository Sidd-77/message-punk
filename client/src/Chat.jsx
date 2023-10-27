import { useContext, useEffect, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";

export default function Chat() {

  const [ ws, setWs] = useState(null);
  const [onlinePeople, setonlinePeople] = useState({});
  const [selectedUserId, setselectedUserId] = useState(null);
  const [newMessageText, setnewMessageText] = useState('');
  const [messages, setmessages] = useState([]);

  const {userName, id} = useContext(UserContext);

  useEffect(()=>{
    let ws = new WebSocket('ws://localhost:4000');
    setWs(ws);
    ws.addEventListener('message', handleMessage);
  },[]);

  const showOnlinePeople = (peopleArray) =>{
    const people = {};
    peopleArray.forEach(({userId,username})=>{
      people[userId] = username;
    })
    setonlinePeople(people);
  }

  const handleMessage = (ev)=>{
    const messageData = JSON.parse(ev.data);

    if('online' in messageData){
      showOnlinePeople(messageData.online);
    }

    if(messageData.text){
      setmessages(prev => ([...prev, {...messageData}]));
    }

  }

  const sendMessage = (ev)=>{
    ev.preventDefault();

    console.log("sending message");
    ws.send(JSON.stringify({
      recipient: selectedUserId,
      text: newMessageText,
    }))

    setmessages(prev => ([...prev, {text:newMessageText, sender:id, recipient:selectedUserId, id: Date.now(),}]));
    setnewMessageText('');
  }

  const messagesWithoutDups = uniqBy(messages, 'id');


  return (
    <div className="flex flex-row h-screen">
      <div className="basis-1/3 bg-white p-2">
        <Logo />

        {Object.keys(onlinePeople).map(userId => {
          if(userId!==id){
            return (

              <div key={userId} className={" border-b border-gray-300 bg-blue-100 py-2 flex items-center cursor-pointer rounded "+(userId===selectedUserId ? " bg-blue-400":"") }
                  onClick={() => setselectedUserId(userId)}
                  >
                { userId === selectedUserId ? <div className=" bg-green-700 w-2"></div> : "" }
                <Avatar userId={userId} username={onlinePeople[userId]}/>
                {onlinePeople[userId]}
              </div>
            )
          }
        })}
      </div>


      <div className="basis-2/3 flex flex-col bg-blue-200 p-2">
        <div className="flex-grow">
            {!selectedUserId && (
              <div className="h-full flex items-center justify-center">
                <div className=" text-gray-500">Select a person to chat</div>
              </div>
            )}

            {!!selectedUserId && (
              <div className="relative h-full">
                <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                  {messagesWithoutDups.map(message => {
                    return (
                      <div className={(message.sender === id ? 'text-right': 'text-left')}>
                        <div className={" text-left inline-block p-2 my-2 rounded-md text-sm "+(message.sender===id?" bg-blue-500 text-white" : "bg-white text-grey-500")}>
                            {message.sender === id? 'Me : ':''}{message.text}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
        </div>


        {!!selectedUserId && (
            <form className="flex gap-2" onSubmit={sendMessage} >
            <input type="text" 
                  value={newMessageText} 
                  onChange={e => setnewMessageText(e.target.value)} 
                  placeholder="Type your message here" 
                  className="flex-grow p-2 rounded-md align-middle" />
  
            <button className=" px-6 py-3 bg-blue-500 rounded-md " type="submit">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </form>
        )}
        
      </div>
    </div>
  );
}
