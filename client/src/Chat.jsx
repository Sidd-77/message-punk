import { useContext, useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";

export default function Chat() {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setonlinePeople] = useState({});
  const [offlinePeople, setofflinePeople] = useState({});
  const [selectedUserId, setselectedUserId] = useState(null);
  const [newMessageText, setnewMessageText] = useState("");
  const [messages, setmessages] = useState([]);
  const divUnderMessage = useRef();

  const { userName, id, setuserName, setId } = useContext(UserContext);

  useEffect(() => {
    connectionToWS();
  }, []);

  function connectionToWS() {
    let ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    //tries to reconnect if connection is lost
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected. Trying to reconnect...");
        connectionToWS();
      }, 1000);
    });
  }

  const showOnlinePeople = (peopleArray) => {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setonlinePeople(people);
  };

  function logout ( ) {
    axios.post('/logout').then(()=>{
      setId(null);
      setuserName(null);
      setWs(null);
    })
  }

  function sendFile(ev){
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = ()=>{
      sendMessage(null, {
        data: reader.result,
        name: ev.target.files[0].name,
      })
    }
  }

  const handleMessage = (ev) => {
    const messageData = JSON.parse(ev.data);

    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    }

    if (messageData.text) {
      setmessages((prev) => [...prev, { ...messageData }]);
    }
  };

  const sendMessage = (ev, file = null) => {
    if(ev) ev.preventDefault();

    console.log("sending message");
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
        sender: id,
        _id: Date.now(),
        file
      })
    );

    setmessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now(),
      },
    ]);
    setnewMessageText("");
  };

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setmessages(res.data);
      });
    }
  }, [selectedUserId]);

  useEffect(() => {
    const div = divUnderMessage.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const people = res.data;
      const offlinePeopleArr = people
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      console.log(offlinePeople);
      const offlinePeopleObj = {};
      offlinePeopleArr.forEach((p) => (offlinePeopleObj[p._id] = p));
      setofflinePeople(offlinePeopleObj);
    });
  }, [onlinePeople]);

  const messagesWithoutDups = uniqBy(messages, "_id");

  return (
    <div className="flex flex-row h-screen">
      <div className="basis-1/3 bg-white p-2 flex flex-col">
        <div className=" flex-grow">
          <Logo />

          {Object.keys(onlinePeople).map((userId) => {
            if (userId !== id) {
              return (
                <Contact
                  key={userId}
                  id={userId}
                  online={true}
                  username={onlinePeople[userId]}
                  onClick={() => setselectedUserId(userId)}
                  selected={selectedUserId === userId}
                />
              );
            }
          })}

          {Object.keys(offlinePeople).map((userId) => {
            if (userId !== id) {
              return (
                <Contact
                  key={userId}
                  id={userId}
                  online={false}
                  username={offlinePeople[userId].username}
                  onClick={() => setselectedUserId(userId)}
                  selected={selectedUserId === userId}
                />
              );
            }
          })}
        </div>
        <div className="p-2 bg-blue-200  flex flex-col rounded-lg">
          <div className="flex flex-row gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-6 h-6"
              className="w-9 h-9 border-2 border-blue-500 rounded-full text-blue-700 justify-start"
            >
              <path
                fill-rule="evenodd"
                d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                clip-rule="evenodd"
              />
            </svg>
            <span className="flex items-center ">{userName}</span>
           
          </div>
          <button onClick={logout} className=" bg-blue-700 text-white p-2 mt-2 rounded-lg shadow hover:shadow-lg">Logout</button>
        </div>
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
                {messagesWithoutDups.map((message) => {
                  return (
                    <div
                      key={message._id}
                      className={
                        message.sender === id ? "text-right" : "text-left"
                      }
                    >
                      <div
                        className={
                          " text-left inline-block p-2 my-2 rounded-md text-sm " +
                          (message.sender === id
                            ? " bg-blue-500 text-white"
                            : "bg-white text-grey-500")
                        }
                      >
                        {message.text}
                      </div>
                    </div>
                  );
                })}
                <div className="" ref={divUnderMessage}></div>
              </div>
            </div>
          )}
        </div>

        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(e) => setnewMessageText(e.target.value)}
              placeholder="Type your message here"
              className="flex-grow p-2 rounded-md align-middle"
            />

            <label className=" hover:cursor-pointer px-4 py-3 bg-blue-300 rounded-md">
              <input type="file" className="hidden" onChange={sendFile}/>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
                <path fill-rule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clip-rule="evenodd" />
              </svg>

            </label>

            <button
              className=" px-4 py-3 bg-blue-500 rounded-md "
              type="submit"
            >
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
