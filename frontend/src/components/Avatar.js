export default function Avatar({ username='?', color='#3570d4', size=36 }) {
  const initial = username.charAt(0).toUpperCase();
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background: color || '#3570d4',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontSize:size*0.4, fontWeight:500,
      flexShrink:0, userSelect:'none',
    }}>
      {initial}
    </div>
  );
}
