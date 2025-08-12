import { Box } from '@mui/material'
import OrderBlockView from './OrderBlock'
import ChangeoverChip from './ChangeoverChip'
import type { OrderBlock, Changeover } from '../types/board'
import { PX_PER_15, effDurationMin } from './packAbut'
import { useDroppable, useDraggable } from '@dnd-kit/core'

const leftPx = (min: number) => (min/15) * PX_PER_15

function DraggableBlock({ b, left, width }:{ b: OrderBlock, left:number, width:number }){
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: b.id, data: { block: b } })
  const style: any = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.8 : 1
  }
  return (
    <Box ref={setNodeRef} {...attributes} {...listeners} sx={{ position:'absolute', left, top:0 }} style={style}>
      <OrderBlockView b={b} left={0} width={width} />
    </Box>
  )
}

export default function BoardLane({ id, name, blocks, changeovers, onSetCoType }:{
  id: string; name: string; blocks: OrderBlock[]; changeovers: Changeover[]; onSetCoType: (fromId:string, toId:string, type:string)=>void
}){
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <Box ref={setNodeRef} sx={{ position:'relative', height: 66, border:'1px solid rgba(1,209,209,0.2)', borderRadius: 2, bgcolor: isOver ? 'rgba(1,209,209,0.08)' : 'rgba(255,255,255,0.02)', mb: 2, px:1 }}>
      <Box sx={{ position:'absolute', left: 8, top: -22, fontWeight: 600 }}>{name}</Box>
      {[...Array(25)].map((_,i)=> (
        <Box key={i} sx={{ position:'absolute', left: leftPx(i*60), top:0, bottom:0, borderLeft:'1px dashed rgba(255,255,255,0.06)' }}/>
      ))}
      {blocks.map(b=>{
        const s = leftPx(b.startMin)
        const w = leftPx(effDurationMin(b))
        return <DraggableBlock key={b.id} b={b} left={s} width={Math.max(12,w)} />
      })}
      {changeovers.map((co)=>{
        const from = blocks.find(b=>b.id===co.fromBlockId)
        const to = blocks.find(b=>b.id===co.toBlockId)
        if(!from || !to) return null
        return <ChangeoverChip key={co.id} fromFam={from.family as any}
          toFam={to.family as any}
          minutes={co.minutes} onSetType={()=>{
            const t = window.prompt('Set CO type (A-J)?', co.typeCode || '')?.toUpperCase()
            if(t){ onSetCoType(from.id, to.id, t) }
          }} />
      })}
    </Box>
  )
} 