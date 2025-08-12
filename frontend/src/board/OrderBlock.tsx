import { Box, Tooltip } from '@mui/material'
import type { OrderBlock } from '../types/board'

const familyColor = (b: OrderBlock) => b.colorHex ?? ({A:'#2E86AB',B:'#6AA84F',C:'#F39C12'} as any)[b.family]

export default function OrderBlockView({ b, left, width }: { b: OrderBlock; left: number; width: number; }) {
  return (
    <Tooltip title={`${b.title} • ${b.family}`} arrow>
      <Box sx={{
        position:'absolute', left, width, top: 10, height: 44,
        bgcolor: familyColor(b),
        border: '1px solid rgba(0,0,0,0.45)', borderRadius: 1.5,
        color: '#0B0F14', fontWeight: 600, display:'flex', alignItems:'center', px: 1,
        cursor: 'grab', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis'
      }}>
        {b.title}
      </Box>
    </Tooltip>
  )
} 