import Page from '../Components/Page'
import { CfxBox } from '../Components/CfxBaseComponents'
import { useContext, useState, useEffect, useRef } from 'react'
import { cfxContext, hostURL, quickFetch, labelEBL, fileURL, getPostDatetimeLabel, combineValidations} from '../utils'
import Form from "../Components/Form/Form"
import { SimpleInput, NumericInput } from "../Components/Form/Input"
import { AvatarTagWidget } from '../Components/UserWidgets'
import { Button, Link, Avatar, Pagination, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear';

const TRANSACTIONS_PER_PAGE = 8


function AccountTagInput({name, label, placeholder, validation}) {
    const [foundUser, setFoundUser] = useState(null)

    const handleChange = (val) => {
        quickFetch('/auth/user/json/' + val)
        .then(u => setFoundUser(u))
        .catch(() => setFoundUser(null))
    }

    const checkFound = (w) => {
        if (w == "")
            return true

        return quickFetch('/auth/user/json/' + w)
            .then(() => true)
            .catch(() => "Не удалось найти пользователя!")
    }

    const v = combineValidations({validate:{checkFound}}, validation)

    return (
        <>
            <SimpleInput 
                name={name}
                label={label}
                placeholder={placeholder}
                validation={v}
                onChange={handleChange}
            />
            {foundUser && (
                <CfxBox>
                    <AvatarTagWidget user={foundUser}/>
                </CfxBox>
            )}
        </>
    )

}

export function EBLInput({name, label, placeholder, validation, onChange, allowZero}) {
    const v = combineValidations({
        validate: {
            is_invalid: (v) => !isNaN(v) && v >= 0 || "Некорректное значение!",
            too_small: (v) => allowZero || v >= 0.01 || "Слишком мало!",
            too_large: (v) => v <= 1e+6 || "Слишком много!"
        },
        required: {
            message: 'Необходимо заполнить!',
            value: true
        }
    }, validation)

    return (
        <NumericInput
            name={name}
            label={label}
            isFloat={true}
            allowNegative={false}
            placeholder={placeholder}
            validation={v}
            onChange={onChange}
            valueTransform={(t) => Math.floor(t * 100) / 100}
        />
    )

}

function SuccessfulTransfer({transfer, onDelete}) {
    return (
        <CfxBox className="bg-green-300/50 grid grid-cols-[1fr_auto] grid-rows-[1fr_auto]">
            <span className="self-center">Успешный перевод <b>{labelEBL(transfer.amount)}</b> пользователю <Link href={`/user/${transfer.dest_tag}`}>@{transfer.dest_tag}</Link></span>
            <div className="row-span-2 self-center">
                <IconButton onClick={onDelete}><ClearIcon/></IconButton>
            </div>
            <div>
                {transfer.comment && <span>Ваш комментарий: <i>{transfer.comment}</i></span>}
            </div>
        </CfxBox>
    )
}

function TransferForm({onCancel, onSuccess}) {
    const {currentUser, updateUserData} = useContext(cfxContext)

    const handleTransfer = (data) => {
        return fetch(hostURL('/ebank/transfer'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials:'include',
            body: JSON.stringify(data)
        })
        .then(r => r.json())
        .then(r => {
            if(!r.success)
                return "Что-то пошло не так..."
            onSuccess(data)
            updateUserData()
            return "Успех!"
        })
        .catch(() => "Что-то пошло не так...")
    }

    return (
        <CfxBox>
            <h1 className="text-2xl mb-1">Новый перевод</h1>
            <Form 
                submitButtonLabel="Перевести"
                onSubmit={handleTransfer}
                additionalButtons={[
                    <Button variant="outlined" onClick={onCancel}>Отмена</Button>
                ]}
            >
                <AccountTagInput 
                    label="Получатель"
                    name="dest_tag"
                    placeholder="capybara"
                    validation={{
                        required:{
                            value:true,
                            message:'Необходимо заполнить!'
                        },
                        validate:{
                            notMe: (w) => w != currentUser.tag || "Перевод самому себе!"
                        }
                    }}
                />
                <EBLInput
                    name="amount"
                    label="Сумма"
                    placeholder="Сумма в EBL"
                    validation={{
                        validate: {
                            sufficient_balance: (v) => v <= currentUser.balance || "Не хватает средств!"
                        }
                    }}
                />
                <SimpleInput
                    name="comment"
                    type="text"
                    label="Комментарий"
                    placeholder="Ваш комментарий"
                    validation={{
                        maxLength:{
                            value:200,
                            message:"Превышен лимит в 200 символов!"
                        }
                    }}
                />
            </Form>
        </CfxBox>

    )

}

export function EbankCard({actions, cardStyle}) {
    const { currentUser } = useContext(cfxContext)
    const [style, setStyle] = useState(cardStyle? cardStyle.style : null) 

    useEffect(() => {
        if (cardStyle)
            return
        quickFetch('/ebank/get_equipped_card_style')
        .then(r => {
            if(!r.success)
                throw Error()
            setStyle(r.card_style.style)
        })
        .catch(() => setStyle({}))
    }, [currentUser])

    useEffect(() => {
        if(cardStyle)
            setStyle(cardStyle.style)
    }, [cardStyle])

    if (!style)
        return <></>

    return (
        <div className="shadow-lg p-5 overflow-hidden rounded-2xl w-[350px] h-[200px] grid grid-cols-[1fr_auto] grid-rows-2 select-none" style={{color:'black', background:'gray', ...style}}>
            <p className="text-3xl font-semibold p-1">{labelEBL(currentUser.balance)}</p>
            <p className="font-semibold justify-self-end text-lg">CfxEbank</p>
            <div className="self-end grid grid-cols-[auto_1fr] grid-rows-2 gap-x-2">
                <div className="row-span-2 self-center">
                    <Avatar src={fileURL(currentUser.avatar_file_id)} sx={{width:42, height:42}}/>
                </div>
                <p className="truncate font-semibold">{currentUser.username}</p>
                <p className="truncate">@{currentUser.tag}</p>
            </div>
            <div className="self-end">
                <ul className="flex flex-col items-end">
                    {actions.map((a, i) => (
                        <li key={i}>
                            <Link 
                                sx={{color: style.color ?? "black" }}
                                component="button"
                                onClick={a.action}
                            >
                                {a.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )

}

function TransactionPages() {
    const [data, setData] = useState(null)
    const { currentUser } = useContext(cfxContext)

    useEffect(() => {
        handlePageSelect(1)
    }, [])

    const handlePageSelect = (page) => {
        if (data)
            setData({...data, items: null})

        quickFetch(`/ebank/view_my_transactions/${TRANSACTIONS_PER_PAGE}/${page}`)
        .then(d => {
            setData({
                total: d.num_pages,
                items: d.items
            })
        })
        .catch(() => setData({error:1}))
    }

    if (!data || data.error || !currentUser)
        return <></>

    return (
        <div>
            {data.items !== null && data.items.length > 0 && (
                <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[450px]">
                <tbody className="[&>*:nth-child(odd)]:bg-cfx-box">
                    <tr>
                        <th className="px-1 py-2 text-left">Пользователь</th>
                        <th className="px-1 py-2 text-left">Количество EBL</th>
                        <th className="px-1 py-2 text-left">Дата и время</th>
                        <th className="px-1 py-2 text-left">Комментарий</th>
                    </tr>
                    {data.items.map((item, i) => (
                        <tr key={i}>
                            <td className="p-1">
                                {(!item.from_user || !item.to_user) && (
                                    <span className="font-semibold">Кофетокс</span>
                                )}
                                {item.from_user && item.from_user.tag != currentUser.tag && (
                                    <AvatarTagWidget user={item.from_user}/>
                                )} 
                                {item.to_user && item.to_user.tag != currentUser.tag && (
                                    <AvatarTagWidget user={item.to_user}/>
                                )}
                            </td>
                            <td className="p-1">
                                {item.to_user && item.to_user.tag == currentUser.tag && (
                                    <span className="text-green-600">+{labelEBL(item.amount)}</span>
                                )}
                                {item.from_user && item.from_user.tag == currentUser.tag && (
                                    <span className="text-red-500">-{labelEBL(item.amount)}</span>
                                )}
                            </td>
                            <td className="p-1">
                                {getPostDatetimeLabel(new Date(item.datetime))}
                            </td>
                            <td className="p-1">
                                <span>{item.comment || "Нет"}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
                </table>
                </div>
            )}
            {data.items === null && (
                <p>Загрузка...</p>
            )}
            <div className="w-full mt-3">
                <Pagination hidePrevButton hideNextButton count={data.total} onChange={(_, p) => handlePageSelect(p)}/>
            </div>
        </div>
    )
}

function BuyEblDialog({isOpen, onClose}) {
    const [eblToRoubles, setEblToRoubles] = useState(null)
    const [eblToBuy, setEblToBuy] = useState(0)
    const methodsRef = useRef(null)

    useEffect(() => {
        quickFetch('/ebank/ebl_to_roubles')
        .then(r => setEblToRoubles(r.coef))
        .catch(() => {})
    }, [])


    const handleBuy = (amount) => {
        quickFetch('/ebank/buy_ebl/' + amount.toFixed(2))
        .then(r => {
            setTimeout(() => location.replace(r.url), 400)
        })
        .catch(() => alert('Ошибка...'))
    }


    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Приобрести EBL</DialogTitle>
            <DialogContent>

                <Form onSubmit={(data) => handleBuy(data.amount)} methodsRef={methodsRef} disableSubmitButton={true}>
                    <EBLInput
                        label="Количество EBL"
                        name="amount"
                        placeholder="10 EBL"
                        onChange={(v) => setEblToBuy(v)}
                    />
                </Form>

                {eblToRoubles && (
                    <div className="mt-5">
                        <p>
                            {labelEBL(1)} = {eblToRoubles + ' RUB'}
                        </p>
                        {eblToBuy < 1000000 && (
                            <p>
                                {labelEBL(eblToBuy)} = {(eblToBuy*eblToRoubles).toFixed(2) + ' RUB'}
                            </p>
                        )}
                    </div>

                )}
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={onClose}>Отмена</Button>
                <Button variant="contained" onClick={() => methodsRef.current.handledSubmit()}>Приобрести</Button>
            </DialogActions>
        </Dialog>
    )

}


function CardStyleDialog({isOpen, onClose}) {
    const { currentUser, updateUserData } = useContext(cfxContext)
    const [tab, setTab] = useState(0)
    const [availableStyles, setAvailableStyles] = useState([])
    const [marketStyles, setMarketStyles] = useState([])

    useEffect(() => {
        quickFetch('/ebank/get_all_card_styles')
        .then(arr => {
            setAvailableStyles(
                arr
                .filter(a => a.is_available)
                .map(a => {
                    return {
                        isEquipped: a.is_equipped,
                        cardStyle: a.card_style
                    }
                })
            )

            setMarketStyles(
                arr
                .filter(a => !a.is_available)
                .map(a => {
                    return {
                        isPurchased: false,
                        cardStyle: a.card_style
                    }
                })
            )

        })
        .catch(() => {})
    }, [])

    useEffect(() => {
        if(!isOpen)
            return
        setMarketStyles(marketStyles.filter(sw => !sw.isPurchased))
    }, [isOpen])


    const handlePurchase = (id) => {
        quickFetch('/ebank/buy_card_style/' + id)
        .then(r => {
            console.log(r)
            if (r.error == 'INSUFFICIENT_BALANCE'){
                alert('Не хватает средств!')
                return
            } else if (r.error)
                throw Error()

            const idx = marketStyles.findIndex(sw => sw.cardStyle.id == id)
            const cardStyle = marketStyles[idx].cardStyle

            setMarketStyles([
                ...marketStyles.slice(0, idx),
                {
                    cardStyle: cardStyle,
                    isPurchased: true
                },
                ...marketStyles.slice(idx + 1)
            ])
            setAvailableStyles([...availableStyles, {cardStyle, isEquipped: false}])

        })
        .catch(() => alert('Ошибка!'))
    }

    const handleEquip = (id) => {
        quickFetch('/ebank/equip_card_style/' + id)
        .then(r => {
            if (!r.success)
                throw Error()

            setAvailableStyles(availableStyles.map(sw => {
                return {
                    cardStyle: sw.cardStyle,
                    isEquipped: sw.cardStyle.id == id
                }
            }))

            updateUserData()
        })
        .catch(() => alert('Ошибка!'))
    }

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Стили карты Ebank</DialogTitle>
            <DialogContent>
                <div className="mb-3">
                    <Tabs value={tab} onChange={(_, t) => setTab(t)}>
                        <Tab label="Доступные"/>
                        <Tab label="Маркет"/>
                    </Tabs> 
                </div>


                {(tab == 0 && availableStyles.length == 0 
                    || tab == 1 && marketStyles.length == 0) && <p>Пусто.</p>}

                <ul className="flex flex-col gap-2 overflow-y-auto max-h-[400px]">
                    {tab == 0 && availableStyles.map((sw, i) => (
                        <li key={i}>
                            <CfxBox className="grid grid-cols-[1fr_auto] grid-rows-[auto_1fr] rounded-2xl gap-2 p-3">
                                <span className="truncate self-center text-xl font-semibold">{sw.cardStyle.name}</span>
                                <div>
                                    {sw.isEquipped && <Button disabled variant="contained">Надето</Button>}
                                    {!sw.isEquipped && <Button onClick={() => handleEquip(sw.cardStyle.id)} variant="contained">Надеть</Button>}
                                </div>
                                <div className="col-span-2 max-w-full overflow-x-auto">
                                    <EbankCard actions={[]} cardStyle={sw.cardStyle}/>
                                </div>
                            </CfxBox>
                        </li>
                    ))}

                    {tab == 1 && marketStyles.map((sw, i) => (
                        <li key={i}>
                            <CfxBox className="grid grid-cols-[1fr_auto] grid-rows-[auto_auto_1fr] rounded-2xl p-3 gap-x-2 gap-y-0">
                                <span className="truncate text-xl font-semibold">{sw.cardStyle.name}</span>
                                <div className="row-span-2 self-center">
                                    {sw.isPurchased && <Button disabled variant="contained">Куплено</Button>}
                                    {!sw.isPurchased && <Button onClick={() => handlePurchase(sw.cardStyle.id)} variant="contained">Купить</Button>}
                                </div>
                                <span className="truncate text-lg">{labelEBL(sw.cardStyle.price)}</span>
                                <div className="col-span-2 mt-2 max-w-full overflow-x-auto">
                                    <EbankCard actions={[]} cardStyle={sw.cardStyle}/>
                                </div>
                            </CfxBox>
                        </li>
                    ))}
                </ul>

            </DialogContent>
            <DialogActions>
                <Button variant='contained' onClick={onClose}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    )
    

}


export default function Ebank() {
    const { currentUser } = useContext(cfxContext)
    const [successfulTransfers, setSuccessfulTransfers] = useState([])
    const [transferFormOpen, setTransferFormOpen] = useState(false)
    const [buyEblOpen, setBuyEblOpen] = useState(false)
    const [cardStyleOpen, setCardStyleOpen] = useState(false)


    useEffect(() => {

        quickFetch('/ebank/check_payments')
        .then(r => {
            if (r.accepted)
                location.reload()
        })
        .catch(() => {})

    }, [])


    if (!currentUser)
        return <>Загрузка...</>
    else if(currentUser.id < 0)
        return <>Вы не вошли в аккаунт.</>

    return (
        <Page documentTitle="Ебанк" title="Управление счётом">
            <EbankCard
                actions={[
                    {label: 'Заказать EBL', action: () => setBuyEblOpen(true)},
                    {label: 'Дизайн карты', action: () => setCardStyleOpen(true)}
                ]}
            />

            <section className="mt-4 flex flex-col gap-2">
                <h2 className="text-2xl">Переводы</h2>
                
                {successfulTransfers.length > 0 && (
                    <ul className="flex flex-col gap-1">
                        {successfulTransfers.map((st, i) => (
                            <li key={i}>
                                <SuccessfulTransfer 
                                    transfer={st}
                                    onDelete={() => {
                                        const w = [...successfulTransfers]
                                        w.splice(i, 1)
                                        setSuccessfulTransfers(w)
                                    }}
                                />
                            </li>
                        ))}
                    </ul>
                )}
                
                {transferFormOpen && (
                    <TransferForm 
                        onCancel={() => setTransferFormOpen(false)}
                        onSuccess={d => {
                            setTransferFormOpen(false)
                            setSuccessfulTransfers([...successfulTransfers, d])
                        }}
                    />
                )}

                {!transferFormOpen && (
                    <div>
                        <Link onClick={() => setTransferFormOpen(true)} component="button">Новый перевод</Link>
                    </div>
                )}

                <TransactionPages/>
                

            </section>

            <BuyEblDialog isOpen={buyEblOpen} onClose={() => setBuyEblOpen(false)}/>
            <CardStyleDialog isOpen={cardStyleOpen} onClose={() => setCardStyleOpen(false)}/>
        </Page>
    )

}