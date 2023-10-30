import Avatar from "./Avatar"

export default function Contanct({id, username, selected, onClick, online}) {
    return (
    <div key={id} className={" border-b border-gray-300 bg-blue-100 py-2 flex items-center cursor-pointer rounded " + (selected ? " bg-blue-400" : "")}
        onClick={() => onClick(id)}>
        
        <Avatar online={online} userId={id} username={username} />
        {username}
    </div>
    )
}