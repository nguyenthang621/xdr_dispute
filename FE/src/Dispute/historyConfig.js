import moment from "moment";
import { Button, Popconfirm } from "antd";
import { Link } from "react-router-dom";
import hostPrefix from "../utils/config";
const DetailButton = ({ record }) => (
  <Link to={`${hostPrefix}/dispute-detail/${record.id}`}>
    <Button
      style={{
        color: "#0070c9",
        borderColor: "#0070c9",
        backgroundColor: "transparent",
      }}
    >
      Detail
    </Button>
  </Link>
);

const DeleteButton = ({ record, handleRemove }) => (
  <Popconfirm
    title="Confirm delete?"
    style={{ width: "100%" }}
    onConfirm={() => handleRemove(record.id)}
  >
    <a style={{ color: "#ff3b30" }}>Delete</a>
  </Popconfirm>
);

export const columns = (handleRemove, getColnSearchProps) => [
  {
    title: "ID",
    dataIndex: "id",
    width: "5%",
    key: "id",
    sorter: (a, b) => a.id - b.id,
    sortDirections: ["ascend", "descend", "ascend"],
  },
  {
    width: "15%",
    title: "Client / Account",
    dataIndex: "client_account",
    key: "client_account",
    ...getColnSearchProps("client_account"),
  },
  {
    width: "12%",
    title: "Subcriber Host",
    dataIndex: "subscriber_host",
    key: "subscriber_host",
    ...getColnSearchProps("subscriber_host"),
    render: (text, record) => {
      return text !== null ? text : "all";
    },
  },

  {
    width: "12%",
    title: "Subscriber ID",
    dataIndex: "subscriber_id",
    key: "subscriber_id",
    ...getColnSearchProps("subscriber_id"),
    render: (text, record) => {
      return text !== null ? text : "all";
    },
  },

  {
    title: "From",
    dataIndex: "start_time",
    width: "15%",
    key: "start_time",
    sorter: (a, b) =>
      moment(a.start_time, "YYYY-MM-DD HH:mm:ssZZ") -
      moment(b.start_time, "YYYY-MM-DD HH:mm:ssZZ"),
    sortDirections: ["ascend", "descend", "ascend"],
  },
  {
    title: "To",
    dataIndex: "stop_time",
    width: "15%",
    key: "stop_time",
    sorter: (a, b) =>
      moment(a.stop_time, "YYYY-MM-DD HH:mm:ssZZ") -
      moment(b.stop_time, "YYYY-MM-DD HH:mm:ssZZ"),
    sortDirections: ["ascend", "descend", "ascend"],
  },
  {
    title: "Total Qty",
    dataIndex: "total",
    width: "7%",
    key: "total",
    sorter: (a, b) => a.total - b.total,
    sortDirections: ["ascend", "descend", "ascend"],
  },
  {
    title: "No L",
    dataIndex: "no_l",
    width: "7%",
    key: "no_l",
    sorter: (a, b) => a.no_l - b.no_l,
    sortDirections: ["ascend", "descend", "ascend"],
  },
  {
    title: "No E",
    dataIndex: "no_e",
    width: "7%",
    key: "no_e",
    sorter: (a, b) => a.no_e - b.no_e,
    sortDirections: ["ascend", "descend", "ascend"],
  },
  {
    title: "",
    width: "10%",
    key: "edit",
    render: (text, record) => <DetailButton record={record} />,
  },
  {
    title: "",
    key: "remove",
    render: (text, record) => (
      <DeleteButton record={record} handleRemove={handleRemove} />
    ),
  },
];

export default columns;
