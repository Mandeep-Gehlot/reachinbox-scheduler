export const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—';