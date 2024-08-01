import MyFileUploader from "../Components/MyFileUploader"
import { useRef } from "react"
import Form from "../Components/Form"


export default function MyFileUploaderTest() {

    const handleSubmit = (data) => {
        console.log(data)
    }

    return (
        <>
            <Form onSubmit={handleSubmit}>
                <MyFileUploader maxSizeBytes={1024 * 500} maxFiles={4} name="hey" width={400} required/>
            </Form>
        </>
    )
}