import { EbankCard } from "./Ebank";
import Form from "../Components/Form";
import { TextAreaInput } from "../Components/Input";

export default function CardStyleDemo() {
    const [style, setStyle] = useState({})

    const handleUpdate = (style_json) => {

        try {
            setStyle(JSON.parse(style_json))
        }
        catch {
            alert('Неверный стиль!')
        }

    }

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