import React from 'react';

export default class ErrorBoundary extends React.Component{
  constructor(p){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(err){ return {err}; }
  render(){
    if(this.state.err) return (
      <div className="boot">
        <h1 style={{color:'#ff4257'}}>ЧТО-ТО ПОШЛО НЕ ТАК</h1>
        <p style={{maxWidth:380,textAlign:'center'}}>{String(this.state.err?.message||this.state.err)}</p>
        <p><button className="btn btn-gold" onClick={()=>location.reload()}>Перезагрузить атлас</button></p>
      </div>
    );
    return this.props.children;
  }
}