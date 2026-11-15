// Presentation-neutral projection only. Do not infer raw vendor entities or backend truth.
function rhiMmPresentation(contract) {
  if (!contract.ready) return {ready:false,reason:contract.reason,rooms:[],summary:null};
  return {
    ready:true,backendVersion:contract.backendVersion,revision:contract.revision,
    summary:contract.summary,
    rooms:[...contract.rooms].sort((a,b) => Number(Boolean(b.active))-Number(Boolean(a.active)) || a.name.localeCompare(b.name))
  };
}

function rhiMmRoomStatus(room) {
  const phases = {
    idle:'Off', starting:'Starting', stopping:'Stopping', active:'Ready',
    partial:'Attention', interrupted:'Recovery required', error:'Error'
  };
  return phases[room?.phase] || 'Unknown';
}

function rhiMmActivityIcon(activityId = '') {
  // Icon is pure decoration; capabilities, labels and command truth come from the backend.
  const id=String(activityId).toLowerCase();
  if (id.includes('music') || id.includes('radio') || id.includes('audio')) return 'mdi:music';
  if (id.includes('game') || id.includes('xbox') || id.includes('playstation')) return 'mdi:controller';
  if (id.includes('tv') || id.includes('television')) return 'mdi:television';
  return 'mdi:play-circle-outline';
}

function rhiMmMediaSubtitle(room) {
  if (room.now_playing?.title) return [room.now_playing.title,room.now_playing.artist].filter(Boolean).join(' · ');
  if (room.activity_name) return room.activity_name;
  return rhiMmRoomStatus(room);
}
