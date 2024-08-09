


export function CfxBox({className, style, children}) {

    return (
        <div className={`p-2 rounded-lg overflow-hidden bg-cfx-box ` + className} style={style}>
            {children}
        </div>
    )

}
