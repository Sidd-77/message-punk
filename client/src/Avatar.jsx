export default function Avatar({userId, username}){

    const colors = ['bg-red-200', 'bg-teal-200', 'bg-green-200', 'bg-orange-200', 'bg-cyan-200', 'bg-purple-200'];
    let userIdb10 = parseInt(userId, 16);
    let ind = userIdb10 % colors.length;
    const clsN = colors[ind] + " rounded-full w-8 h-8 mx-2 flex items-center";
    return (
        <div className={clsN}>
            <div className=" text-center w-full">{username[0]}</div>
        </div>
    )
}