import Page from "../../Components/Page";
import { SimpleInput, EBLInput } from "../../Components/Form/Input";
import Form from "../../Components/Form/Form";
import { quickFetchPostJSON } from "../../utils";

export default function CreateEbankFundraising() {


    const handleSubmit = (data) => {

        return quickFetchPostJSON('/ebank/create_fundraising', data)
        .then(r => {
            if(r.error) {
                return {
                    muiError:'Неизвестная ошибка!',
                    alertDefaultTitle:true
                }
            }

            return {
                alertDefaultTitle: true,
                disableSubmit: true,
                muiSuccess: `Сбор средств успешно создан. Код для его интеграции: {ebank-fundraising-${r.id}}`
            }

        })
        .catch(() => {
            return {
                muiError: 'Потеряно соединение с сервером!',
                alertDefaultTitle: true
            }
        })

    }

    return (
        <Page title="Создать сбор средств">
            <Form
                onSubmit={handleSubmit}
                submitButtonLabel="Создать"
            >
                <SimpleInput 
                    label="Заголовок"
                    name="title"
                    placeholder="Мне на донат..."
                    validation={{
                        maxLength: {
                            value: 100,
                            message: 'Превышен лимит в 100 символов!'
                        }
                    }}
                />
                <EBLInput 
                    label="Цель"
                    name="goal"
                />
            </Form>
        </Page>
    )

}