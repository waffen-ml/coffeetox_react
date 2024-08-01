import { useSearchParams } from "react-router-dom"

export default function ResetPasswordResult() {
    const [searchParams, _] = useSearchParams()

    return (
        <>
            <h1 className="text-3xl">Восстановление доступа</h1>
            <p>Новый пароль: {searchParams.get('new_password')}</p>
        </>
    )
}