import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom';
import {ReactComponent as Arrow} from './left_arrow.svg'
import {ReactComponent as Download} from './download.svg'
import './Diary.css'
import html2canvas from 'html2canvas'
import saveAs from 'file-saver'

const Diary = () => {
    const paperRef = useRef(null);
    const [serverData, setServerData] = useState(undefined);
    const [imageLoaded, setImageLoaded] = useState(false); // Track if the image is loaded
    const user_id = useParams().user_id;
    const date = useParams().date;
    const [diaryindex, setIndex] = useState(0);
    const navigate = useNavigate();

    useEffect(()=>{
        const fetchData = async () => {
            try {
                const response = await fetch(`http://13.209.82.235:8000/api/diary/get_diary/${user_id}`, {
                    method: 'GET',
                    headers: {
                    'Content-Type': 'application/json',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setServerData(data);
                } else {
                    console.error("Failed to fetch data:", response.status);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    if (serverData === undefined || serverData["diary"][date] === undefined){
        return <div>404 Not Found</div>
    }
    const diaries = serverData["diary"][date]

    const handleArrowClick = (direction) => {
        if (direction === "left" && diaryindex > 0) {
            setIndex(diaryindex-1)
        } else if (direction === "right" && diaryindex < diaries.length-1) {
            setIndex(diaryindex+1)
        }
    };

    const capture = async () => {
        if (!paperRef.current || !imageLoaded) return;
    
        const canvas = await html2canvas(paperRef.current);
    
        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, `${date}_${diaryindex}.png`);
            }
        });
    };

    return (
        <div className='diaryPage'>
            <div className='backbutton' onClick={()=>(navigate(`/${user_id}`))}>
                <span><Arrow className="backbuttonarrow"/></span><span>Back to Calendar</span>
            </div>
            <div className='downloadbutton' onClick={capture}>
                <span><Download className="downloadbuttonicon"/></span>
            </div>
            <div className={`left_arrow ${diaryindex === 0 ? '' : 'active'}`} onClick={() => handleArrowClick("left")}>
                <Arrow className={`${diaryindex === 0 ? 'arrow' : 'arrow active'}`}></Arrow>
            </div>
            <div className={`right_arrow ${diaryindex === diaries.length-1 ? '' : 'active'}`} onClick={() => handleArrowClick("right")}>
                <Arrow className={`${diaryindex === diaries.length-1 ? 'arrow' : 'arrow active'}`}></Arrow>
            </div>
            <div className='paper' ref={paperRef}>
                <div className='diary'>
                    <div className='date diarycomponent'><span className='templatetext'>Date: </span><span className='kidtext'>{date}</span></div>
                    <div className='study_time diarycomponent'><span className='templatetext'>Studied time: </span><span className='kidtext'>{diaries[diaryindex]["study_time"]}</span></div>
                    <img
                        src={diaries[diaryindex]["img"]}
                        className="diaryimage diarycomponent"
                        onLoad={() => setImageLoaded(true)} // Set imageLoaded to true once image has loaded
                        alt="Diary"
                    />
                    <div className='title diarycomponent'><span className='templatetext'>Title: </span><span className='kidtext'>{diaries[diaryindex]["title"]}</span></div>
                    <div className='diarycontent diarycomponent kidtext'>{diaries[diaryindex]["content"]}</div>
                </div>
            </div>
        </div>
    )
}

export default Diary
