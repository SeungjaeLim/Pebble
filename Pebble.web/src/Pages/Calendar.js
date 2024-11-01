import React, {useState, useContext, useEffect} from 'react'
import './Calendar.css'
import { useParams } from "react-router-dom";
import {ReactComponent as Arrow} from './left_arrow.svg'
import { useNavigate } from 'react-router-dom';  

const month_str_list = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]

const Calendar = () => {
    const user_id = useParams().user_id;
    const [serverData, setServerData] = useState(undefined);

    const navigate = useNavigate();  

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // Current month
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear()); // Current year

    useEffect(()=>{
        const fetchData = async () => {
            try {
                const response = await fetch(`http://13.209.82.235:8000/api/diary/get_diary/sehoon1106`, {
                    method: 'GET',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log(data)
                    setServerData(data);
                } else {
                    console.error("Failed to fetch data:", response.status);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
    
        fetchData();
    }, [])
    
    if (serverData === undefined){
        return <div>404 Not Found</div>
    }

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Get number of days in the month
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // Index of the first day (0 = Sunday)

    const tiles = [];
    for (let i = 0; i < firstDayIndex; i++) {
        tiles.push(null); // Empty slots before the first day
    }

    for (let day = 1; day <= daysInMonth; day++) {
        tiles.push(day);
    }

    // Handle tile click
    const handleTileClick = (day) => {
        const date = currentYear+'-'+(currentMonth+1)+'-'+day
        if (serverData === undefined || serverData["diary"][date] === undefined){
            return;
        }
        navigate(`/${user_id}/${date}`)
    };

    const handleArrowClick = (direction) => {
        if (direction === "left"){
            if (currentMonth === 0){
                setCurrentYear(currentYear-1)
                setCurrentMonth(11)
            }
            else{
                setCurrentMonth((currentMonth-1)%12)
            }
        }
        else{
            if (currentMonth === 11){
                setCurrentYear(currentYear+1)
                setCurrentMonth(0)
            }
            else{
                setCurrentMonth((currentMonth+1)%12)
            }
        }
    }

    const generate_tile = (day, index) => {
        const date = currentYear+'-'+(currentMonth+1)+'-'+day
        const have_diary = serverData["diary"][date] ? true : false
        let diarys = serverData["diary"][date] ? serverData["diary"][date] : []
        console.log(serverData["diary"][date])

        return(
        <div key={index} className={`tile ${have_diary ? 'active' : ''}`} onClick={() => handleTileClick(day)}>
            {   
                day && (
                <>
                    <div className='white_circle'/>
                    {diarys.length>1 && (
                        <>
                            <div className='red_circle'/>
                            <div className="diary_num">{diarys.length}</div>
                        </>
                        )}
                    {have_diary&& <img src={diarys[0]["img"]} alt="placeholder" style={{height:'100%'}} />}
                    <div className="day">{day}</div>
                    <div/>
                </>
                )
            }
        </div>)
    }

    return (
        <div className='calendarPage'>
            <div className='left_arrow active' onClick={()=>handleArrowClick("left")}><Arrow></Arrow></div>
            <div className='right_arrow active' onClick={()=>handleArrowClick("right")}><Arrow></Arrow></div>
            <div className="calendar">
                <div className="header">
                    <div className="month">{month_str_list[currentMonth]}</div>
                    <div className="name"> Welcome {serverData["user_name"]}</div>
                    <div className="totalstudytime">Small <strong>pebbles</strong> make a mountain</div>
                </div>
                <div className="days">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div className="tiles">
                    {tiles.map((day, index) => (generate_tile(day, index)))}
                </div>
            </div>
        </div>
    )
}

export default Calendar