import Form from "../Components/Form"
import {SimpleInput} from "../Components/Input"
import { passwordValidation, passwordRepValidation, hostURL } from "../utils"
import Page from '../Components/Page'

export default function ChangePassword() {

    const handleSubmit = (data) => {

        return fetch(hostURL('/change_password'), {
            method: 'POST',
            credentials:'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                new_password: data.password,
                old_password: data.old_password
            })
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                throw Error()

            return 'Пароль успешно изменен!'
        })
        .catch(() => {
            return 'Не удалось обновить пароль.'
        })

    }

    return (
        <Page title="Сменить пароль">
            <Form onSubmit={handleSubmit}>
                <SimpleInput type="password" name="old_password" label="Старый пароль" validation={{required: true}}/>
                <SimpleInput type="password" name="password" label="Новый пароль" validation={passwordValidation}/>
                <SimpleInput type="password" name="password_rep" label="Повторите новый пароль" validation={passwordRepValidation}/>
            </Form>
        </Page>
    )

}