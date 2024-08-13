import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import MoreVertIcon from '@mui/icons-material/MoreVert'
import {Link, IconButton, Menu, MenuItem} from "@mui/material"
import { useState } from 'react';

export function CfxBox({children, className, ...props}) {

    return (
        <div className={`p-2 rounded-lg overflow-hidden bg-cfx-box ` + className} {...props}>
            {children}
        </div>
    )

}

export function MaxContentWidth({children}) {
    return (
        <div className="max-w-full" style={{width:'max-content'}}>
            {children}
        </div>
    )
}

export function QuickBreadcrumbsButton({options, vertical}) {
    const [actionMenuAnchor, setActionMenuAnchor] = useState(null)

    return (
        <>
            <IconButton onClick={(e) => setActionMenuAnchor(e.currentTarget)}>
                {!vertical && <MoreHorizIcon />}
                {vertical && <MoreVertIcon />}
            </IconButton>

            <Menu
                id="action-menu"
                anchorEl={actionMenuAnchor}
                open={Boolean(actionMenuAnchor)}
                onClose={() => setActionMenuAnchor(null)}
            >
                {options.map((op, i) => (
                    <MenuItem 
                        href={op.url}
                        onClick={() => {
                            if(op.action)
                                op.action()
                            setActionMenuAnchor(null)
                        }}
                        key={i}
                    >
                        {op.label}
                    </MenuItem>
                ))}
            </Menu>
        </>
    )

}

