import { EbankCard } from "./Ebank";
import Form from "../Components/Form";
import { TextAreaInput } from "../Components/Input";
import { useState, useContext } from "react";
import { cfxContext } from "../utils";

export default function CardStyleDemo() {
    const [style, setStyle] = useState({})
    const {currentUser} = useContext(cfxContext)

    const handleUpdate = (style_json) => {

        try {
            setStyle(JSON.parse(style_json))
        }
        catch {
            alert('Неверный стиль!')
        }

    }

    if(!currentUser)
        return <>Загрузка...</>
    else if(currentUser.id < 0)
        return <>Необходимо войти в аккаунт!</>

    return (
        <div className="flex flex-col gap-2">
            <EbankCard actions={[]} cardStyle={{style}}/>
            <span className="mb-5">{JSON.stringify(style)}</span>
            <Form submitButtonLabel="Применить" onSubmit={(d) => handleUpdate(d.style_json)}>
                <TextAreaInput 
                    label="JSON-объект стиля"
                    name="style_json"
                    placeholder="{background:white}"
                />
            </Form>
        </div>
    )

}