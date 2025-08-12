import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

export default function Orders(){
  const qc = useQueryClient()
  const { data: rows } = useQuery({ queryKey:['orders'], queryFn: async ()=> (await api.get('/orders')).data })
  const mut = useMutation({
    mutationFn: async ({ id, patch }: { id: number, patch: any }) => (await api.patch(`/orders/${id}`, patch)).data,
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ['orders'] })
      const prev = qc.getQueryData<any[]>(['orders'])
      if(prev){
        qc.setQueryData<any[]>(['orders'], prev.map(o => o.id === id ? { ...o, ...patch } : o))
      }
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if(ctx?.prev){ qc.setQueryData(['orders'], ctx.prev) }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orders'] })
  })

  function onLeverChange(id: number, value: number){
    if(Number.isFinite(value)){
      const v = Math.max(50, Math.min(120, Math.round(value)))
      mut.mutate({ id, patch: { performanceLeverPct: v } })
    }
  }
  function onColorChange(id: number, value: string){
    mut.mutate({ id, patch: { colorHex: value } })
  }

  return (
    <Box>
      <Paper>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Order</TableCell><TableCell>Shop‑Floor Title</TableCell><TableCell>SKU</TableCell>
            <TableCell>Family</TableCell><TableCell>Units</TableCell><TableCell>Performance Lever %</TableCell><TableCell>Color</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {(rows||[]).map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{r.orderNo}</TableCell>
                <TableCell>{r.shopfloorTitle}</TableCell>
                <TableCell>{r.sku?.code}</TableCell>
                <TableCell>{r.sku?.family}</TableCell>
                <TableCell>{r.qty}</TableCell>
                <TableCell>
                  <TextField size="small" type="number" value={r.performanceLeverPct}
                    onChange={e=> onLeverChange(r.id, Number(e.target.value))} sx={{ width: 100 }}/>
                </TableCell>
                <TableCell>
                  <input type="color" value={r.colorHex || '#2E86AB'} onChange={e=> onColorChange(r.id, e.target.value)}/>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
