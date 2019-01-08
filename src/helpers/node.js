export default class node{
  constructor(props){
    Object.assign(this, {
      index: session.data.nodes.length,
      id: '',
      selected: false,
      cluster: 1,
      visible: true,
      degree: 0,
      origin: []
    }, props);
  }
};
