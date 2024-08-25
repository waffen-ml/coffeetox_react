import { EbankCard, EBLInput } from "./Ebank";
import Form from "../Components/Form";
import { TextAreaInput, SimpleInput } from "../Components/Input";
import { useState, useContext } from "react";
import { cfxContext, hostURL } from "../utils";

export default function CardStyleDemo() {
    const [style, setStyle] = useState({})
    const [styleError, setStyleError] = useState(false)
    const {currentUser} = useContext(cfxContext)

    const handleStyleChange = (json) => {
        try {
            setStyle(JSON.parse(json))
            setStyleError(false)
        }
        catch {
            setStyleError(true)
        }
    }

    const handleSubmit = (data) => {
        return fetch(hostURL('/ebank/add_card_style'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: data.name,
                price: data.price,
                style_json: JSON.stringify(style)
            })
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()
            return 'Стиль успешно добавлен! ID: ' + r.id
        })
        .catch(() => 'Ошибка!')
    } 

    if(!currentUser)
        return <>Загрузка...</>
    else if(currentUser.id < 0)
        return <>Необходимо войти в аккаунт!</>

    return (
        <div className="flex flex-col gap-2">
            <EbankCard actions={[]} cardStyle={{style}}/>
            {styleError && <span>Ошибка стилизации!</span>}
            <Form submitButtonLabel="Добавить" onSubmit={handleSubmit} defaultValues={{price:0}}>
                <TextAreaInput 
                    label="JSON-объект стиля"
                    name="style_json"
                    placeholder="{background:white}"
                    onChange={handleStyleChange}
                />
                <SimpleInput
                    label="Имя стиля"
                    name="name"
                    placeholder="Стандарт"
                    validation={{
                        required: {
                            value:true,
                            message:'Необходимо заполнить!'
                        },
                        maxLength: {
                            value:100,
                            message: 'Превышен лимит в 100 символов!'
                        }
                    }}
                />
                <EBLInput
                    name="price"
                    label="Цена (EBL)"
                    allowZero={true}
                />
            </Form>
        </div>
    )

}