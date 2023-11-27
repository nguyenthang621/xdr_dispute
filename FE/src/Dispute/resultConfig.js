import { Tag } from 'antd';

// Color Constants
export const red_color = '#F5B7B1';
export const yellow_color = '#FAD7A0';
export const green_color = '#A9DFBF';
export const blue_color = '#AED6F1';

// Function to render tags based on the result text
export const renderResultTags = (text) => {
  switch (text) {
    case 'G':
      return (
        <div>
          <Tag color={green_color}>L</Tag>
          <br />
          <Tag color={green_color}>E</Tag>
        </div>
      );
    case 'Y':
      return (
        <div>
          <Tag color={yellow_color}>L</Tag>
          <br />
          <Tag color={yellow_color}>E</Tag>
        </div>
      );
    case 'L':
      return (
        <div>
          <Tag color={blue_color}>L</Tag>
          <br />
          <Tag color={red_color}>E</Tag>
        </div>
      );
    default:
      return (
        <div>
          <Tag color={red_color}>L</Tag>
          <br />
          <Tag color={blue_color}>E</Tag>
        </div>
      );
  }
};

// Table columns
export const columns = [
  {
    title: '',
    render: (text, record,index) =>   index + 1,
    width: '1%',
  },
  {
    title: 'Result',
    dataIndex: 'result',
    key: 'rs',
    width: '1%',
    render: (text) => renderResultTags(text),
  },
  {   
    width:'15%',
    title:'SRC Party ID',
    dataIndex:'src_party_id_ext_local',
    key:'src_party_id_ext_local',
    // ...getColumnSearchProps('src_party_id_ext_local'),
    render: (text, record) =>{
      let local = text?text:"No matched record"
      let ext = record["src_party_id_ext_ext"] ? record["src_party_id_ext_ext"] : "No matched record"
      return (<div>{local}<br/>{ext}</div>)
    }
  },
  {
      title:'DST Party ID',
      dataIndex:'dst_party_id_ext_local',
      width: '15%',
      key:'dst_party_id_ext_local',
    //   ...getColumnSearchProps('dst_party_id_ext_local'),
      render: (text, record) =>{
        let local = text?text:"null"
        let ext = record["dst_party_id_ext_ext"] ? record["dst_party_id_ext_ext"] : "null"
        return (<div>{local}<br/>{ext}</div>)
      }
      
  },
  
  {
    title:'Connect Time',
    dataIndex:'start_time_local',
    width: '20%',
    key:'start_time_local',
    render: (text, record) =>{
      let local = text?text:"null"
      let ext = record["start_time_ext"] ? record["start_time_ext"] : "null"
      return (<div>{local}<br/>{ext}</div>)
    },
    
    
  },
 
  {
    title:'Finish Time',
    dataIndex:'stop_time_local',
    width: '20%',
    key:'stop_time',
    render: (text, record) =>{
      let local = text?text:"null"
      let ext = record["stop_time_ext"] ? record["stop_time_ext"] : "null"
      return (<div>{local}<br/>{ext}</div>)
    }
  },

  {
    title:'Volume',
    dataIndex:'volume_local',
    width: '10%',
    key:'volume_local',
    render: (text, record) =>{
      let local = parseInt(text)>=0?text:"null"
      let ext = record["volume_ext"] ? record["volume_ext"] : "null"
      return (<div>{local}<br/>{ext}</div>)
    }
  },
];

export const empty_columns = [
    {
        title:''
    },
    {   
      width:'15%',
      title:'SRC Party ID'
    },
    {
        title:'DST Party ID'
    },
    
    {
      title:'Connect Time'
    },
   
    {
      title:'Finish Time'
    },

    {
      title:'Volume'
    },
  ]
