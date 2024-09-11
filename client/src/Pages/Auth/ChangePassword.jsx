import Form from "../../Components/Form/Form"
import {SimpleInput} from "../../Components/Form/Input"
import { passwordValidation, passwordRepValidation, hostURL, quickFetchPostJSON} from "../../utils"
import Page from '../../Components/Page'

export default function ChangePassword() {

    const handleSubmit = (data) => {
        const toSend = {
            old_password: data.old_password,
            new_password: data.password
        }

        return quickFetchPostJSON('/auth/change_password', toSend)
        .then(r => {
            if (r.error) {
                return {
                    muiError: {
                        'INCORRECT_PASSWORD': 'Неверный пароль!',
                        'INVALID_DATA': 'Введены некорректные данные!'
                    }[r.error] ?? 'Неизвестная ошибка',
                    alertDefaultTitle: true
                }
            }

            return {
                muiSuccess: 'Пароль успешно изменен!'
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
        <Page title="Сменить пароль">
            <Form onSubmit={handleSubmit}>
                <SimpleInput type="password" name="old_password" label="Старый пароль" validation={{required: true}}/>
                <SimpleInput type="password" name="password" label="Новый пароль" validation={passwordValidation}/>
                <SimpleInput type="password" name="password_rep" label="Повторите новый пароль" validation={passwordRepValidation}/>
            </Form>
        </Page>
    )

}

