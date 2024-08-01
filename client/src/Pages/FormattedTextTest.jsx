import FormattedText from '../Components/FormattedText'
import { useRef, useState } from 'react'
import { Button } from '@mui/material'

const linkRegex = /(([a-zA-Z]+:\/\/)?(([a-zA-Z0-9\-]+\.)+([a-zA-Z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-zA-Z0-9_\-\.~]+)*(\/([a-zA-Z0-9_\-\.]*)(\?[a-zA-Z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/


export default function FormattedTextTest() {
    const inputRef = useRef(null)
    const [text, setText] = useState('')

    return (
        <div className="flex flex-col items-start gap-4 w-full">   
            <textarea className="shadow-lg border-black max-w-full w-[300px]" ref={inputRef}></textarea>
            <Button onClick={() => setText(inputRef.current.value)}>Update</Button>
            <FormattedText text={text} renderAttachments={true}/>
        </div>
    )

}