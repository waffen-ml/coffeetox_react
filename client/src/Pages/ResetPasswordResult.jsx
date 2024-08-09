import { useSearchParams } from "react-router-dom"
import Page from "../Components/Page"

export default function ResetPasswordResult() {
    const [searchParams, _] = useSearchParams()

    return (
        <Page documentTitle="Восстановление доступа">
            <p>Новый пароль: {searchParams.get('new_password')}</p>
        </Page>
    )
}