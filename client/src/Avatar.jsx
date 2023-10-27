export default function Avatar({userId, username, online}){

    const colors = ['bg-red-200', 'bg-teal-200', 'bg-green-200', 'bg-orange-200', 'bg-cyan-200', 'bg-purple-200'];
    let userIdb10 = parseInt(userId, 16);
    let ind = userIdb10 % colors.length;
    const clsN = colors[ind] + " relative rounded-full w-8 h-8 mx-2 border border-white flex items-center";
    return (
        <div className={clsN}>
            <div className=" text-center w-full">{username?username[0]:''}</div>
            {online && <div className=" absolute w-2.5 h-2.5 rounded-full bg-green-500 bottom-0 right-0 border border-white"></div>}
            
        </div>
    )
}